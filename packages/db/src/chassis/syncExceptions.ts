// Chassis capabilities for the offline sync-exception surface (_chassis.md §4.1). Pure
// (db, ctx, input) functions — the canonical capability shape. `db` is the withTenant tx, so every
// query here is already RLS-scoped to ctx.orgId; the explicit can() check adds the intra-org
// permission gate (RLS scopes rows, the capability scopes actions — both required, §5.4).
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { withTenant, type Tx } from './withTenant.js';
import { type Context, can, ForbiddenError } from '../identity/context.js';

/** recordSyncException — a drained command rejected by a server-side guard becomes a row here.
 *  Runs in its OWN withTenant tx, COMMITTED INDEPENDENTLY of the rolled-back business write, so
 *  "surface, don't auto-merge" survives even though the rejection rolled back the effect. Idempotent
 *  on (org_id, command_id) so a re-drain of the same rejected command doesn't pile up duplicates. */
export async function recordSyncException(ctx: Context, input: {
  commandId: string;
  commandType: string;
  payload: unknown;
  membershipId?: string | null;
  clientTs: string | Date;
  entityRef?: { type: string; id: string } | null;
  reasonCode: string;
  reasonDetail?: string | null;
}) {
  return withTenant(ctx.orgId, async (tx) => {
    const rows = (await tx.execute(sql`
      insert into sync_exceptions (command_id, command_type, payload, membership_id, client_ts,
                                   entity_ref, reason_code, reason_detail, created_by)
      values (${input.commandId}::uuid, ${input.commandType}, ${JSON.stringify(input.payload)}::jsonb,
              ${input.membershipId ?? ctx.membershipId}::uuid, ${new Date(input.clientTs).toISOString()},
              ${input.entityRef ? JSON.stringify(input.entityRef) : null}::jsonb,
              ${input.reasonCode}, ${input.reasonDetail ?? null}, ${ctx.membershipId}::uuid)
      on conflict (org_id, command_id) do nothing
      returning id, status, reason_code
    `)) as unknown as Array<Record<string, unknown>>;
    return rows[0] ?? null; // null = already recorded (idempotent no-op)
  });
}

export const listFilter = z.object({
  status: z.enum(['open', 'resolved', 'dismissed']).optional(),
  reasonCode: z.string().optional(),
  commandType: z.string().optional(),
  membershipId: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(200).default(50),
});
export type ListFilter = z.infer<typeof listFilter>;

/** listSyncExceptions — paginated open-by-default list for the supervisor surface. */
export async function listSyncExceptions(db: Tx, ctx: Context, input: ListFilter) {
  if (!can(ctx, 'chassis.sync.review')) throw new ForbiddenError('chassis.sync.review');
  const f = listFilter.parse(input);
  const status = f.status ?? 'open';
  const rows = await db.execute(sql`
    select id, command_id, command_type, payload, membership_id, client_ts, entity_ref,
           reason_code, reason_detail, status, resolution_note, resolved_by, resolved_at, created_at
    from sync_exceptions
    where status = ${status}
      ${f.reasonCode ? sql`and reason_code = ${f.reasonCode}` : sql``}
      ${f.commandType ? sql`and command_type = ${f.commandType}` : sql``}
      ${f.membershipId ? sql`and membership_id = ${f.membershipId}::uuid` : sql``}
    order by client_ts desc
    limit ${f.limit}
  `);
  return { items: rows as unknown as Array<Record<string, unknown>> };
}

export const resolveSyncExceptionInput = z.object({
  id: z.string().uuid(),
  resolution: z.enum(['resolved', 'dismissed']),
  note: z.string().max(2000).optional(),
});
export type ResolveSyncExceptionInput = z.infer<typeof resolveSyncExceptionInput>;

/** resolveSyncException — transition open → resolved|dismissed, auto-stamping the actor. The
 *  compare-and-set WHERE status='open' makes concurrent/duplicate resolutions idempotent. */
export async function resolveSyncException(db: Tx, ctx: Context, input: ResolveSyncExceptionInput) {
  if (!can(ctx, 'chassis.sync.resolve')) throw new ForbiddenError('chassis.sync.resolve');
  const i = resolveSyncExceptionInput.parse(input);
  const updated = await db.execute(sql`
    update sync_exceptions
       set status = ${i.resolution},
           resolution_note = ${i.note ?? null},
           resolved_by = ${ctx.membershipId}::uuid,
           resolved_at = now(),
           updated_at = now(),
           updated_by = ${ctx.membershipId}::uuid
     where id = ${i.id}::uuid and status = 'open'
     returning id, status, resolved_by, resolved_at
  `);
  const rows = updated as unknown as Array<Record<string, unknown>>;
  if (rows.length === 0) {
    // either not found in this org (RLS) or already terminal
    const exists = (await db.execute(sql`select status from sync_exceptions where id = ${i.id}::uuid`)) as unknown as Array<{ status: string }>;
    if (exists.length === 0) throw new Error('NOT_FOUND');
    throw new Error('INVALID_TRANSITION');
  }
  return rows[0];
}
