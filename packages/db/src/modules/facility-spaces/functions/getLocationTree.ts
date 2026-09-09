// Function: getLocationTree (public) — the physical tree (property > floor > room/area) filtered by
// kind/parentId/activeOnly; ordered kind,floor,sort,code (spec §4). Pure (db, ctx, input); `db` arrives
// already tenant-scoped.
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import type { Context, DbOrTx } from '@astralitics/module-identity-access';
import { can, ForbiddenError } from '@astralitics/module-identity-access';

const uuid = z.string().uuid();

export const treeFilter = z.object({ kind: z.string().optional(), parentId: uuid.optional(), activeOnly: z.boolean().default(true) });
export type TreeFilter = z.infer<typeof treeFilter>;

export async function getLocationTree(db: DbOrTx, ctx: Context, input?: TreeFilter) {
  if (!can(ctx, 'facility.location.read')) throw new ForbiddenError('facility.location.read');
  const f = treeFilter.parse(input ?? {});
  const rows = await db.execute(sql`
    select id, kind, parent_id, code, name, floor_number, room_type, fachada_zone, area_categoria, qr_token, current_status, current_block_id, sort_order, is_active
    from locations
    where 1=1
      ${f.activeOnly ? sql`and is_active = true` : sql``}
      ${f.kind ? sql`and kind = ${f.kind}` : sql``}
      ${f.parentId ? sql`and parent_id = ${f.parentId}::uuid` : sql``}
    order by kind, floor_number, sort_order, code
  `);
  return rows as unknown as Array<Record<string, unknown>>;
}
