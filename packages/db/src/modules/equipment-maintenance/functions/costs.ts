// equipment-maintenance capability — costPerAsset (the cost rollup that sells, D12). Sums the
// canonical money row (asset_events.cost) over a window, by asset/area. The single AssetEvent written
// by completeMaintenanceOrder is what this sums (the satellite keeps the parts/external breakdown);
// double-counting would corrupt the KPI. Back-ported from copafix capabilities.ts.
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import type { Context, DbOrTx } from '@astralitics/module-identity-access';
import { can, ForbiddenError } from '@astralitics/module-identity-access';

const uuid = z.string().uuid();

export const costInput = z.object({
  assetId: uuid.optional(),
  area: z.string().optional(),
  fromDays: z.number().int().min(1).max(3650).default(90),
});
export async function costPerAsset(db: DbOrTx, ctx: Context, input?: z.infer<typeof costInput>) {
  if (!can(ctx, 'equipment.costs.read')) throw new ForbiddenError('equipment.costs.read');
  const f = costInput.parse(input ?? {});
  const rows = (await db.execute(sql`
    select a.id as asset_id, a.code, a.name, a.area, coalesce(sum(e.cost), 0)::numeric as event_cost, count(e.id)::int as event_count
    from assets a left join asset_events e
      on e.asset_id = a.id and e.cost is not null and e.at >= now() - (${f.fromDays} || ' days')::interval
    where ${f.assetId ? sql`a.id = ${f.assetId}::uuid` : sql`true`}
      ${f.area ? sql`and a.area = ${f.area}` : sql``}
    group by a.id, a.code, a.name, a.area
    having coalesce(sum(e.cost), 0) > 0
    order by event_cost desc
  `)) as unknown as Array<Record<string, unknown>>;
  return rows.map((r) => ({ ...r, total: Number(r.event_cost) }));
}
