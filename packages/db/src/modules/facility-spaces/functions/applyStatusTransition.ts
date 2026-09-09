// Function: applyStatusTransition (public) — THE single guarded write door to room status (spec §4).
// Every other module/surface writes status ONLY through it (module-map §2). Guards R1–R6 make the
// offline outbox safe: a stale write can never regress an inspected room (D3). Pure (db, ctx, input);
// `db` arrives already tenant-scoped (RLS is the installed-app runtime's job, the migration enforces it).
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import type { Context, DbOrTx } from '@astralitics/module-identity-access';
import { can, FunctionError, ForbiddenError } from '@astralitics/module-identity-access';
import { catalog } from '@astralitics/definitions';
import { isDownRank, isLegalTransition } from './transitions.js';

const uuid = z.string().uuid();

export const applyStatusTransitionInput = z.object({
  locationId: uuid,
  toStatus: catalog.schema('space_status'),
  source: catalog.schema('status_event_source'),
  idempotencyKey: z.string().min(1),
  reasonCode: z.string().optional(),
  note: z.string().max(2000).optional(),
  taskId: uuid.optional(),
  blockId: uuid.optional(),
  clientTs: z.union([z.string(), z.date()]).optional(),
  prevEventId: uuid.optional(),
});
export type ApplyStatusTransitionInput = z.infer<typeof applyStatusTransitionInput>;

export async function applyStatusTransition(db: DbOrTx, ctx: Context, input: ApplyStatusTransitionInput) {
  const i = applyStatusTransitionInput.parse(input);
  if (!can(ctx, 'facility.status.transition')) throw new ForbiddenError('facility.status.transition');
  if (i.toStatus === 'Lista' && !can(ctx, 'facility.status.release')) throw new ForbiddenError('facility.status.release');

  // R6 — idempotent replay: same key returns the original event, no error.
  const dup = (await db.execute(sql`
    select id, to_status from space_status_events where idempotency_key = ${i.idempotencyKey} limit 1
  `)) as unknown as Array<{ id: string; to_status: string }>;
  if (dup.length) return { event: dup[0], currentStatus: dup[0].to_status, replayed: true };

  const locs = (await db.execute(sql`
    select id, kind, current_status, current_status_event_id, current_block_id
    from locations where id = ${i.locationId}::uuid
  `)) as unknown as Array<{ id: string; kind: string; current_status: string | null; current_status_event_id: string | null; current_block_id: string | null }>;
  const loc = locs[0];
  if (!loc) throw new FunctionError('LOCATION_NOT_FOUND');
  if (loc.kind !== 'room') throw new FunctionError('NOT_A_ROOM'); // R1

  // R5 — block: a blocked room only accepts transitions carrying its block_id (from block fns).
  if (loc.current_block_id && i.blockId !== loc.current_block_id) throw new FunctionError('BLOCKED_ROOM');

  const from = loc.current_status;
  const legal = isLegalTransition(from, i.toStatus);
  const down = isDownRank(from, i.toStatus);

  // R3 — staleness: the client enqueued against prevEventId; if the head moved, it's stale.
  const stale = !!i.prevEventId && i.prevEventId !== loc.current_status_event_id;
  if (stale) {
    // benign convergence: still legal from the CURRENT head AND not a down-rank → apply anyway.
    if (!legal || down) throw new FunctionError('STALE_EVENT'); // an inspected room never regresses by an old write
  } else if (!legal) {
    throw new FunctionError('ILLEGAL_TRANSITION');
  }

  // R4 — down-rank needs a reason.
  if (down && !i.reasonCode) throw new FunctionError('MISSING_REASON');

  const inserted = (await db.execute(sql`
    insert into space_status_events
      (location_id, from_status, to_status, source, reason_code, note, task_id, block_id,
       actor_membership_id, client_ts, idempotency_key, prev_event_id, created_by)
    values
      (${i.locationId}::uuid, ${from}, ${i.toStatus}, ${i.source}, ${i.reasonCode ?? null},
       ${i.note ?? null}, ${i.taskId ?? null}::uuid, ${i.blockId ?? null}::uuid,
       ${ctx.membershipId}::uuid, ${i.clientTs ? new Date(i.clientTs).toISOString() : null},
       ${i.idempotencyKey}, ${i.prevEventId ?? null}::uuid, ${ctx.membershipId}::uuid)
    returning id, from_status, to_status, source, reason_code, created_at
  `)) as unknown as Array<Record<string, unknown>>;
  const event = inserted[0];

  await db.execute(sql`
    update locations
       set current_status = ${i.toStatus}, current_status_event_id = ${event.id as string}::uuid,
           updated_at = now(), updated_by = ${ctx.membershipId}::uuid
     where id = ${i.locationId}::uuid
  `);
  return { event, currentStatus: i.toStatus, replayed: false };
}
