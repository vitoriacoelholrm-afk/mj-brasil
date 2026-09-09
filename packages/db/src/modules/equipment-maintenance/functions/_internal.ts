// equipment-maintenance — shared internal helpers for the capability files. addAssetEvent is the
// internal timeline writer every mutation calls (not on the public surface). mintQr/pgTextArray are
// the copafix helpers kept verbatim. db is a tenant-scoped DbOrTx (no withTenant in the catalog —
// the installed-app runtime owns the GUC/RLS chokepoint; capabilities receive a scoped db).
import { sql } from 'drizzle-orm';
import type { Context, DbOrTx } from '@astralitics/module-identity-access';

/** A Postgres text[] array literal as a bound param (frecuencia_preset is a closed enum → safe values). */
export const pgTextArray = (arr: readonly string[]) => `{${arr.join(',')}}`;

export const mintQr = () =>
  'EQR-' +
  ((globalThis as { crypto?: { randomUUID?: () => string } }).crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2))
    .replace(/-/g, '')
    .slice(0, 12)
    .toUpperCase();

/** Append a row to the per-asset timeline (Beamy pattern). Internal — every mutation logs one. */
export async function addAssetEvent(
  db: DbOrTx,
  ctx: Context,
  e: { assetId: string; eventType: string; note?: string | null; cost?: number | null; currencyCode?: string | null; vendorId?: string | null; taskId?: string | null; documentId?: string | null; trackInFinance?: boolean },
) {
  const actor = ctx.membershipId ? `member:${ctx.membershipId}` : ctx.actor ?? 'app';
  await db.execute(sql`
    insert into asset_events (org_id, asset_id, event_type, actor, note, cost, currency_code, vendor_id, task_id, document_id, track_in_finance, created_by)
    values (${ctx.orgId}::uuid, ${e.assetId}::uuid, ${e.eventType}, ${actor}, ${e.note ?? null}, ${e.cost ?? null}, ${e.currencyCode ?? null},
            ${e.vendorId ?? null}::uuid, ${e.taskId ?? null}::uuid, ${e.documentId ?? null}::uuid, ${e.trackInFinance ?? false}, ${ctx.actor})
  `);
}
