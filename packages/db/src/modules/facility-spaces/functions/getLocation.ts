// Function: getLocation (public) — minimal one-location resolver → {id, label:`code — name`} for
// cross-module soft-uuid validation + label snapshots (G9, spec §4). This is the function OTHER modules
// (equipment-maintenance/scheduling references 'Location') call: facility-spaces is a LOW dependency, so
// higher modules INJECT this resolver via deps (anti-cycle G24) rather than hard-import facility-spaces.
// The signature/return ({id,label}) is therefore a stable contract — do not change it.
// Pure (db, ctx, input); `db` arrives already tenant-scoped.
import { sql } from 'drizzle-orm';
import type { Context, DbOrTx } from '@astralitics/module-identity-access';
import { can, FunctionError, ForbiddenError } from '@astralitics/module-identity-access';

export async function getLocation(db: DbOrTx, ctx: Context, input: { id: string }) {
  if (!can(ctx, 'facility.location.read')) throw new ForbiddenError('facility.location.read');
  const rows = (await db.execute(sql`select id, code, name from locations where id = ${input.id}::uuid`)) as unknown as Array<{ id: string; code: string; name: string }>;
  if (!rows.length) throw new FunctionError('LOCATION_NOT_FOUND');
  return { id: rows[0].id, label: `${rows[0].code} — ${rows[0].name}` };
}
