// Function: getLegalTransitions (public) — the legal next statuses for a room (UI renders only these)
// via transitions.legalNext on current_status (spec §4). Pure (db, ctx, input); `db` arrives already
// tenant-scoped.
import { sql } from 'drizzle-orm';
import type { Context, DbOrTx } from '@astralitics/module-identity-access';
import { can, FunctionError, ForbiddenError } from '@astralitics/module-identity-access';
import { legalNext } from './transitions.js';

export async function getLegalTransitions(db: DbOrTx, ctx: Context, input: { locationId: string }) {
  if (!can(ctx, 'facility.house.read')) throw new ForbiddenError('facility.house.read');
  const rows = (await db.execute(sql`select current_status from locations where id = ${input.locationId}::uuid and kind = 'room'`)) as unknown as Array<{ current_status: string | null }>;
  if (!rows.length) throw new FunctionError('LOCATION_NOT_FOUND');
  return { from: rows[0].current_status, to: legalNext(rows[0].current_status) };
}
