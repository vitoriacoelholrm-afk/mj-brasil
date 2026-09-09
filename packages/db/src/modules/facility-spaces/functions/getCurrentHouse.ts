// Function: getCurrentHouse (public) — the read model (the 06:30 "house", spec §4). Rooms (kind=room,
// active) with a claveDisplay (FU when current_block_id set, else current_status) + a totals map.
// Pairs with transitions.occupancyFromTotals for the occupancy KPI. Pure (db, ctx, input); `db` arrives
// already tenant-scoped.
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import type { Context, DbOrTx } from '@astralitics/module-identity-access';
import { can, ForbiddenError } from '@astralitics/module-identity-access';

export const houseFilter = z.object({
  floorNumbers: z.array(z.number().int()).optional(),
  statuses: z.array(z.string()).optional(),
});
export type HouseFilter = z.infer<typeof houseFilter>;

export async function getCurrentHouse(db: DbOrTx, ctx: Context, input?: HouseFilter) {
  if (!can(ctx, 'facility.house.read')) throw new ForbiddenError('facility.house.read');
  const f = houseFilter.parse(input ?? {});
  const rooms = (await db.execute(sql`
    select id as location_id, code, floor_number, room_type, current_status as status,
           current_block_id as block_id, updated_at as last_event_at
    from locations
    where kind = 'room' and is_active = true
      ${f.floorNumbers?.length ? sql.raw(`and floor_number in (${f.floorNumbers.map((n) => Number(n)).join(',')})`) : sql``}
    order by floor_number, sort_order, code
  `)) as unknown as Array<Record<string, unknown>>;
  const totals: Record<string, number> = {};
  for (const r of rooms) {
    const clave = r.block_id ? 'FU' : ((r.status as string) ?? 'sin_estado'); // FU is derived (R: block overlay)
    totals[clave] = (totals[clave] ?? 0) + 1;
  }
  const filtered = f.statuses?.length
    ? rooms.filter((r) => f.statuses!.includes((r.block_id ? 'FU' : (r.status as string)) ?? ''))
    : rooms;
  return { rooms: filtered.map((r) => ({ ...r, claveDisplay: r.block_id ? 'FU' : r.status })), totals };
}
