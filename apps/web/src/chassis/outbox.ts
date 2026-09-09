// The offline command outbox (_chassis.md §1.4, §2.3, §4.3). Persists domain *commands* (data) in
// IndexedDB and replays them through tRPC mutations when connectivity returns — the robust upgrade
// of the demo's localStorage-upsert hack. Framework-agnostic + dependency-injected so the core
// (FIFO drain, idempotency-key=command-id, media-before-metadata, conflict→rejected) is unit-testable
// without a browser; the SW shell, Web Locks singleton, and trigger wiring are thin glue around it.
import Dexie, { type Table } from 'dexie';

export type OutboxStatus = 'pending' | 'inflight' | 'done' | 'failed' | 'rejected';

export interface OutboxCommand {
  id: string;                 // generated on enqueue; IS the idempotency key (UUID)
  type: string;               // canonical <module>.<Function> (§1.4)
  payload: Record<string, unknown>;
  clientTs: number;           // epoch ms — FIFO order + audit
  attempts: number;
  status: OutboxStatus;
  lastError?: string;
  mediaIds?: string[];
}

export interface OutboxMedia {
  id: string;
  commandId: string;
  kind: 'photo' | 'signature';
  blob: Blob;
  mime: string;
  bytes: number;
  documentId?: string;        // set after storeDocument.confirm; payload rewritten with it
}

export class OutboxDb extends Dexie {
  commands!: Table<OutboxCommand, string>;
  media!: Table<OutboxMedia, string>;
  constructor(name = 'mj-brasil-outbox') {
    super(name);
    this.version(1).stores({ commands: 'id, status, clientTs', media: 'id, commandId' });
  }
}

// ── command registry ──────────────────────────────────────────────────────────────────────────
const CANONICAL = /^[a-z][a-z0-9-]*\.[a-zA-Z][a-zA-Z0-9]*$/; // <module>.<Function>, or app.<Function>
const known = new Set<string>();

/** Register a drainable command type. The control-plane calls this per module from offline.commands,
 *  qualifying the bare Function name with the module name (§1.4). Rejects short aliases / bare types. */
export function registerCommand(type: string): void {
  if (!CANONICAL.test(type)) throw new Error(`registerCommand: '${type}' is not a canonical <module>.<Function> type`);
  known.add(type);
}
export function isRegistered(type: string): boolean { return known.has(type); }
export function _resetRegistry(): void { known.clear(); } // test seam

// ── enqueue ───────────────────────────────────────────────────────────────────────────────────
export interface EnqueueInput {
  type: string;
  payload: Record<string, unknown>;
  media?: Array<Omit<OutboxMedia, 'id' | 'commandId' | 'documentId'>>;
  now?: () => number;
  uuid?: () => string;
}

/** Persist a command (+ its media blobs) atomically. Returns the command id (= idempotency key).
 *  Optimistic cache application is the caller's concern; this owns durability only. */
export async function enqueueCommand(db: OutboxDb, input: EnqueueInput): Promise<string> {
  const uuid = input.uuid ?? (() => crypto.randomUUID());
  const now = input.now ?? (() => Date.now());
  const id = uuid();
  const mediaRows: OutboxMedia[] = (input.media ?? []).map((m) => ({ ...m, id: uuid(), commandId: id }));
  await db.transaction('rw', db.commands, db.media, async () => {
    await db.commands.add({
      id, type: input.type, payload: input.payload, clientTs: now(),
      attempts: 0, status: 'pending', mediaIds: mediaRows.map((m) => m.id),
    });
    if (mediaRows.length) await db.media.bulkAdd(mediaRows);
  });
  return id;
}

// ── drain ─────────────────────────────────────────────────────────────────────────────────────
/** Thrown by the injected runMutation to tell the drainer how to treat a failure. A domain
 *  rejection (guard/permission/claim-lost) is terminal → rejected + a server SyncException; a
 *  transient error (network/5xx) is retryable → stays pending with backoff. */
export interface CommandFailure { retryable: boolean; reasonCode?: string; message: string; }

export interface DrainDeps {
  /** Call the tRPC mutation mapped to `type`, with idempotencyKey = command id. Throws CommandFailure. */
  runMutation: (type: string, payload: Record<string, unknown>, idempotencyKey: string) => Promise<unknown>;
  /** Upload one media blob (platform-core.storeDocument prepare→PUT→confirm) → its documentId. */
  uploadMedia: (m: OutboxMedia) => Promise<{ documentId: string }>;
}

export interface DrainSummary { drained: number; rejected: number; retried: number; skipped: number; }

/** Drain pending commands in FIFO (clientTs) order. Singleton in production (Web Locks); the core
 *  is sequential and idempotent so a double-drain is harmless. */
export async function drainOutbox(db: OutboxDb, deps: DrainDeps): Promise<DrainSummary> {
  const pending = (await db.commands.where('status').equals('pending').toArray()).sort((a, b) => a.clientTs - b.clientTs);
  const s: DrainSummary = { drained: 0, rejected: 0, retried: 0, skipped: 0 };

  for (const cmd of pending) {
    if (!isRegistered(cmd.type)) { await mark(db, cmd, 'rejected', `unknown_command: ${cmd.type}`); s.rejected++; continue; }
    await db.commands.update(cmd.id, { status: 'inflight' });
    try {
      // 1. media before metadata — the server never references a not-yet-uploaded file.
      const media = await db.media.where('commandId').equals(cmd.id).toArray();
      const documentIds: Record<string, string> = {};
      for (const m of media) {
        if (!m.documentId) { const { documentId } = await deps.uploadMedia(m); m.documentId = documentId; await db.media.put(m); }
        documentIds[m.id] = m.documentId!;
      }
      const payload = media.length ? { ...cmd.payload, documentIds } : cmd.payload;
      // 2. the mutation, keyed by the command id.
      await deps.runMutation(cmd.type, payload, cmd.id);
      await mark(db, cmd, 'done');
      s.drained++;
    } catch (e) {
      const f = e as CommandFailure;
      if (f && f.retryable === false) { await mark(db, cmd, 'rejected', f.message, f.reasonCode); s.rejected++; }
      else { await db.commands.update(cmd.id, { status: 'pending', attempts: cmd.attempts + 1, lastError: (f?.message ?? String(e)) }); s.retried++; }
    }
  }
  return s;
}

async function mark(db: OutboxDb, cmd: OutboxCommand, status: OutboxStatus, lastError?: string, _reason?: string) {
  await db.commands.update(cmd.id, { status, ...(lastError ? { lastError } : {}) });
}

/** Prune `done` commands older than `retentionDays` (the chassis-maintenance trigger's client half). */
export async function pruneDone(db: OutboxDb, retentionDays: number, now = Date.now()): Promise<number> {
  const cutoff = now - retentionDays * 86_400_000;
  const stale = await db.commands.where('status').equals('done').filter((c) => c.clientTs < cutoff).toArray();
  await db.transaction('rw', db.commands, db.media, async () => {
    for (const c of stale) { await db.media.where('commandId').equals(c.id).delete(); await db.commands.delete(c.id); }
  });
  return stale.length;
}
