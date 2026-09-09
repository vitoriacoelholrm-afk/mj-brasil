// withIdempotency — ADR-12 made code (_chassis.md §4.2). Wraps every drainable mutation so the
// drainer can replay safely: a key that already succeeded returns its stored response WITHOUT
// re-executing (exactly-once for same-DB effects, regime (a) — the key row + the business write
// commit in the same tenant tx); a same key with a DIFFERENT payload is a `duplicate_command`
// reject; an in-flight key is a retryable CONFLICT. `db` is the withTenant tx, so the idempotency
// row is org-scoped and rolls back with the business write on failure.
import { createHash } from 'node:crypto';
import { sql } from 'drizzle-orm';
import type { Tx } from './withTenant.js';
import type { Context } from '../identity/context.js';

/** Stable sha256 of a command payload — the drain endpoint computes this from the RECEIVED body
 *  (never trusts a client-sent hash). Key order is normalized so logically-equal payloads match. */
export function hashPayload(payload: unknown): string {
  const canonical = JSON.stringify(payload, Object.keys(flatten(payload)).sort());
  return createHash('sha256').update(canonical).digest('hex');
}
function flatten(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : { _: v };
}

export class DuplicateCommandError extends Error {
  code = 'DUPLICATE_COMMAND' as const;
  constructor() { super('duplicate_command: same idempotency key with a different payload'); }
}
export class IdempotencyConflictError extends Error {
  code = 'IDEMPOTENCY_CONFLICT' as const;
  constructor() { super('idempotency: a prior attempt with this key is still in flight'); }
}

/** Run `fn` exactly once per (org, key). Returns { result, replayed }. */
export async function withIdempotency<T>(
  db: Tx,
  _ctx: Context,
  args: { key: string; commandType: string; payloadHash: string },
  fn: () => Promise<T>,
): Promise<{ result: T; replayed: boolean }> {
  const { key, commandType, payloadHash } = args;

  // Atomic claim. org_id defaults from the GUC; the (org_id,key) unique index serializes races.
  const claim = (await db.execute(sql`
    insert into idempotency_keys (key, command_type, request_hash, status)
    values (${key}::uuid, ${commandType}, ${payloadHash}, 'in_flight')
    on conflict (org_id, key) do nothing
    returning id
  `)) as unknown as Array<{ id: string }>;

  if (claim.length === 0) {
    const ex = (await db.execute(sql`
      select request_hash, status, response from idempotency_keys where key = ${key}::uuid
    `)) as unknown as Array<{ request_hash: string; status: string; response: unknown }>;
    const row = ex[0];
    if (!row) throw new IdempotencyConflictError(); // disappeared mid-flight; let the drainer retry
    if (row.request_hash !== payloadHash) throw new DuplicateCommandError();
    if (row.status === 'succeeded') return { result: row.response as T, replayed: true };
    // in_flight or rejected → retryable conflict (a reaper/timeout clears stuck in_flight rows)
    throw new IdempotencyConflictError();
  }

  // Claimed: run the effect, then mark succeeded with its response — same tx as the business write.
  const result = await fn();
  await db.execute(sql`
    update idempotency_keys
       set status = 'succeeded', response = ${JSON.stringify(result ?? null)}::jsonb,
           completed_at = now(), updated_at = now()
     where key = ${key}::uuid
  `);
  return { result, replayed: false };
}
