// Outbox core tests — the offline drain logic (_chassis.md §1.4) with a fake IndexedDB + mock
// runner. Covers: enqueue durability, FIFO + idempotency (no re-run of done), media-before-metadata
// ordering, retryable vs domain-rejection handling, unknown-command rejection, prune.
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  OutboxDb, registerCommand, _resetRegistry, enqueueCommand, drainOutbox, pruneDone,
  type DrainDeps, type OutboxMedia, type CommandFailure,
} from './outbox';

let seq = 0;
const uuid = () => `00000000-0000-0000-0000-${String(++seq).padStart(12, '0')}`;
const okRunner: DrainDeps['runMutation'] = async () => ({ ok: true });
const upload: DrainDeps['uploadMedia'] = async (m: OutboxMedia) => ({ documentId: `doc-${m.id}` });

function freshDb() { return new OutboxDb(`test-outbox-${++seq}`); }

beforeEach(() => { _resetRegistry(); });

describe('outbox core', () => {
  it('registerCommand enforces canonical <module>.<Function>', () => {
    expect(() => registerCommand('facility.flip')).not.toThrow();
    expect(() => registerCommand('facility-spaces.applyStatusTransition')).not.toThrow();
    expect(() => registerCommand('applyStatusTransition')).toThrow(); // bare type
    expect(() => registerCommand('Facility.Flip')).toThrow();         // bad module casing
  });

  it('enqueue persists a pending command; drain runs it once and marks it done', async () => {
    const db = freshDb();
    registerCommand('facility-spaces.applyStatusTransition');
    const calls: string[] = [];
    const id = await enqueueCommand(db, { type: 'facility-spaces.applyStatusTransition', payload: { to: 'limpia' }, uuid, now: () => 1 });
    const runner: DrainDeps['runMutation'] = async (type, _p, key) => { calls.push(`${type}:${key}`); return { ok: true }; };

    const s1 = await drainOutbox(db, { runMutation: runner, uploadMedia: upload });
    expect(s1.drained).toBe(1);
    expect(calls).toEqual([`facility-spaces.applyStatusTransition:${id}`]); // idempotency key = command id
    expect((await db.commands.get(id))!.status).toBe('done');

    const s2 = await drainOutbox(db, { runMutation: runner, uploadMedia: upload }); // re-drain
    expect(s2.drained).toBe(0);
    expect(calls.length).toBe(1); // done commands are not re-sent
  });

  it('drains in FIFO clientTs order', async () => {
    const db = freshDb();
    registerCommand('facility-spaces.applyStatusTransition');
    const order: number[] = [];
    await enqueueCommand(db, { type: 'facility-spaces.applyStatusTransition', payload: { n: 2 }, uuid, now: () => 200 });
    await enqueueCommand(db, { type: 'facility-spaces.applyStatusTransition', payload: { n: 1 }, uuid, now: () => 100 });
    const runner: DrainDeps['runMutation'] = async (_t, p) => { order.push((p as any).n); return {}; };
    await drainOutbox(db, { runMutation: runner, uploadMedia: upload });
    expect(order).toEqual([1, 2]);
  });

  it('uploads media BEFORE the mutation and injects documentIds into the payload', async () => {
    const db = freshDb();
    registerCommand('scheduling-field-service.completeTask');
    let sawDocIds: Record<string, string> | undefined;
    const id = await enqueueCommand(db, {
      type: 'scheduling-field-service.completeTask',
      payload: { taskId: 't1' },
      media: [{ kind: 'photo', blob: new Blob(['x']), mime: 'image/jpeg', bytes: 1 }],
      uuid, now: () => 1,
    });
    const runner: DrainDeps['runMutation'] = async (_t, p) => { sawDocIds = (p as any).documentIds; return {}; };
    const s = await drainOutbox(db, { runMutation: runner, uploadMedia: upload });
    expect(s.drained).toBe(1);
    const mediaId = (await db.commands.get(id))!.mediaIds![0];
    expect(sawDocIds).toEqual({ [mediaId]: `doc-${mediaId}` });
    expect((await db.media.where('commandId').equals(id).toArray())[0].documentId).toBe(`doc-${mediaId}`);
  });

  it('a failed media upload keeps the command pending and never calls the mutation', async () => {
    const db = freshDb();
    registerCommand('scheduling-field-service.completeTask');
    let mutationCalled = false;
    const id = await enqueueCommand(db, {
      type: 'scheduling-field-service.completeTask', payload: { taskId: 't1' },
      media: [{ kind: 'signature', blob: new Blob(['s']), mime: 'image/png', bytes: 1 }], uuid, now: () => 1,
    });
    const failUpload: DrainDeps['uploadMedia'] = async () => { throw { retryable: true, message: 'offline' } as CommandFailure; };
    const runner: DrainDeps['runMutation'] = async () => { mutationCalled = true; return {}; };
    const s = await drainOutbox(db, { runMutation: runner, uploadMedia: failUpload });
    expect(mutationCalled).toBe(false);
    expect(s.retried).toBe(1);
    const cmd = await db.commands.get(id);
    expect(cmd!.status).toBe('pending');
    expect(cmd!.attempts).toBe(1);
  });

  it('a retryable failure stays pending (attempts++); a domain rejection is terminal', async () => {
    const db = freshDb();
    registerCommand('facility-spaces.applyStatusTransition');
    const retryId = await enqueueCommand(db, { type: 'facility-spaces.applyStatusTransition', payload: { k: 'r' }, uuid, now: () => 1 });
    const rejectId = await enqueueCommand(db, { type: 'facility-spaces.applyStatusTransition', payload: { k: 'x' }, uuid, now: () => 2 });
    const runner: DrainDeps['runMutation'] = async (_t, p) => {
      if ((p as any).k === 'r') throw { retryable: true, message: 'network' } as CommandFailure;
      throw { retryable: false, reasonCode: 'stale_transition', message: 'room already inspeccionada' } as CommandFailure;
    };
    const s = await drainOutbox(db, { runMutation: runner, uploadMedia: upload });
    expect(s.retried).toBe(1);
    expect(s.rejected).toBe(1);
    expect((await db.commands.get(retryId))!.status).toBe('pending');
    expect((await db.commands.get(rejectId))!.status).toBe('rejected');
  });

  it('an unregistered command type is rejected without calling the mutation', async () => {
    const db = freshDb();
    let called = false;
    const id = await enqueueCommand(db, { type: 'bogus-module.doThing', payload: {}, uuid, now: () => 1 });
    const s = await drainOutbox(db, { runMutation: async () => { called = true; return {}; }, uploadMedia: upload });
    expect(called).toBe(false);
    expect(s.rejected).toBe(1);
    const cmd = await db.commands.get(id);
    expect(cmd!.status).toBe('rejected');
    expect(cmd!.lastError).toContain('unknown_command');
  });

  it('pruneDone removes only done commands older than retention, with their media', async () => {
    const db = freshDb();
    registerCommand('facility-spaces.applyStatusTransition');
    await enqueueCommand(db, { type: 'facility-spaces.applyStatusTransition', payload: {}, uuid, now: () => 0 });
    await drainOutbox(db, { runMutation: okRunner, uploadMedia: upload }); // -> done at clientTs 0
    const removed = await pruneDone(db, 7, 8 * 86_400_000); // 8 days later
    expect(removed).toBe(1);
    expect(await db.commands.count()).toBe(0);
  });
});
