// Function: getStatusHistory (public) — the append-only event history for a location (desc, capped at
// 500, spec §4). Pure (db, ctx, input); `db` arrives already tenant-scoped.
import { sql } from 'drizzle-orm';
import type { Context, DbOrTx } from '@astralitics/module-identity-access';
import { can, ForbiddenError } from '@astralitics/module-identity-access';

export async function getStatusHistory(db: DbOrTx, ctx: Context, input: { locationId: string; limit?: number }) {
  if (!can(ctx, 'facility.location.read')) throw new ForbiddenError('facility.location.read');
  const rows = await db.execute(sql`
    select id, from_status, to_status, source, reason_code, note, actor_membership_id, client_ts, created_at
    from space_status_events
    where location_id = ${input.locationId}::uuid
    order by created_at desc
    limit ${Math.min(input.limit ?? 100, 500)}
  `);
  return rows as unknown as Array<Record<string, unknown>>;
}
