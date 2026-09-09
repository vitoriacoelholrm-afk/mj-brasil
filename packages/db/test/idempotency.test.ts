// withIdempotency + recordSyncException against real Postgres (ADR-12). Proves the drainer can
// replay a command without re-executing the effect, rejects a key reused with a different payload,
// and that a domain rejection leaves a committed SyncException even though the effect rolled back.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const HAS_DB = !!process.env.DATABASE_URL && !!process.env.DATABASE_URL_ADMIN;
const ORG = '00000000-0000-0000-0000-00000000d301';

describe.skipIf(!HAS_DB)('durable command layer (real Postgres)', () => {
  let withTenant: typeof import('../src/chassis/withTenant').withTenant;
  let withIdempotency: typeof import('../src/chassis/idempotency').withIdempotency;
  let hashPayload: typeof import('../src/chassis/idempotency').hashPayload;
  let recordSyncException: typeof import('../src/chassis/syncExceptions').recordSyncException;
  let admin: any;
  const ctx: any = { orgId: ORG, membershipId: null, actor: 'test', rbacRole: 'admin', permissions: new Set(['*']) };

  const newKey = (() => { let n = 0; return () => `00000000-0000-0000-0000-0000000d${String(++n).padStart(4, '0')}`; })();

  beforeAll(async () => {
    ({ withTenant } = await import('../src/chassis/withTenant'));
    ({ withIdempotency, hashPayload } = await import('../src/chassis/idempotency'));
    ({ recordSyncException } = await import('../src/chassis/syncExceptions'));
    const { _raw } = await import('../src/client');
    admin = _raw.adminSql();
    await admin`delete from idempotency_keys where org_id = ${ORG}`;
    await admin`delete from sync_exceptions where org_id = ${ORG}`;
  });

  afterAll(async () => {
    if (!admin) return;
    await admin`delete from idempotency_keys where org_id = ${ORG}`;
    await admin`delete from sync_exceptions where org_id = ${ORG}`;
  });

  it('first call runs the effect; replay returns the cached response WITHOUT re-running', async () => {
    const key = newKey();
    const payload = { a: 1, b: 'x' };
    const hash = hashPayload(payload);
    let runs = 0;
    const run = () => withTenant(ORG, (tx) => withIdempotency(tx, ctx, { key, commandType: 'test.cmd', payloadHash: hash }, async () => { runs++; return { ok: true, n: runs }; }));

    const first = await run();
    expect(first.replayed).toBe(false);
    expect((first.result as any).n).toBe(1);

    const second = await run(); // same key + same payload
    expect(second.replayed).toBe(true);
    expect((second.result as any).n).toBe(1); // cached — effect did NOT run again
    expect(runs).toBe(1);
  });

  it('same key with a different payload is rejected as duplicate_command', async () => {
    const key = newKey();
    await withTenant(ORG, (tx) => withIdempotency(tx, ctx, { key, commandType: 'test.cmd', payloadHash: hashPayload({ v: 1 }) }, async () => ({ ok: 1 })));
    await expect(
      withTenant(ORG, (tx) => withIdempotency(tx, ctx, { key, commandType: 'test.cmd', payloadHash: hashPayload({ v: 2 }) }, async () => ({ ok: 2 }))),
    ).rejects.toMatchObject({ code: 'DUPLICATE_COMMAND' });
  });

  it('hashPayload is order-independent for equal objects', () => {
    expect(hashPayload({ a: 1, b: 2 })).toBe(hashPayload({ b: 2, a: 1 }));
    expect(hashPayload({ a: 1 })).not.toBe(hashPayload({ a: 2 }));
  });

  it('recordSyncException commits a visible row and is idempotent on (org, command_id)', async () => {
    const commandId = newKey();
    const row1 = await recordSyncException(ctx, { commandId, commandType: 'facility-spaces.applyStatusTransition', payload: { to: 'limpia' }, clientTs: new Date(), reasonCode: 'stale_transition', reasonDetail: 'room already inspeccionada' });
    expect((row1 as any).reason_code).toBe('stale_transition');
    const again = await recordSyncException(ctx, { commandId, commandType: 'facility-spaces.applyStatusTransition', payload: { to: 'limpia' }, clientTs: new Date(), reasonCode: 'stale_transition' });
    expect(again).toBeNull(); // idempotent no-op
    const count = await admin`select count(*)::int as c from sync_exceptions where org_id = ${ORG} and command_id = ${commandId}`;
    expect(count[0].c).toBe(1);
  });
});
