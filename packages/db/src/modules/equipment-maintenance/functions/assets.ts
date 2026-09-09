// equipment-maintenance capabilities — the asset registry slice (spec §4). Pure (db, ctx, input)
// functions; db is a tenant-scoped DbOrTx. health_status is written ONLY by setAssetHealth;
// lifecycle_status ONLY by transitionAssetLifecycle (the single-door discipline). The raw
// db.execute(sql`…`) path is kept verbatim from copafix; org_id is set explicitly on inserts (no
// withTenant GUC default in the catalog). Back-ported from copafix capabilities.ts.
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import type { Context, DbOrTx } from '@astralitics/module-identity-access';
import { can, FunctionError, ForbiddenError } from '@astralitics/module-identity-access';
import { catalog } from '@astralitics/definitions';
import { isLegalLifecycle, isRetire, isHealth, healthRequiresNote } from './transitions.js';
import { addAssetEvent, mintQr, pgTextArray } from './_internal.js';

const uuid = z.string().uuid();

// ── createAsset ─────────────────────────────────────────────────────────────────────────────────
export const assetCreateInput = z.object({
  code: z.string().min(1).max(64),
  name: z.string().min(1),
  kind: catalog.schema('tipo_activo').default('equipo'),
  area: catalog.schema('area_operativa'),
  parentAssetId: uuid.optional(),
  locationId: uuid.optional(),
  criticality: catalog.schema('prioridad_equipo').default('Estándar'),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  vendorId: uuid.optional(),
  vendorContact: z.string().optional(),
  purchaseDate: z.string().optional(),
  warrantyExpiresAt: z.string().optional(),
  warrantyNotes: z.string().optional(),
  pmFrequencies: z.array(catalog.schema('frecuencia_preset')).default([]),
  specs: z.record(z.unknown()).default({}),
  notes: z.string().optional(),
});
export type AssetCreateInput = z.infer<typeof assetCreateInput>;

export async function createAsset(db: DbOrTx, ctx: Context, input: AssetCreateInput) {
  const i = assetCreateInput.parse(input);
  if (!can(ctx, 'equipment.asset.manage')) throw new ForbiddenError('equipment.asset.manage');
  if (i.kind === 'equipo_habitacion' && !i.locationId) throw new FunctionError('LOCATION_REQUIRED');

  const dup = (await db.execute(sql`select id from assets where code = ${i.code} limit 1`)) as unknown as Array<{ id: string }>;
  if (dup.length) throw new FunctionError('DUPLICATE_CODE');
  if (i.parentAssetId) {
    const p = (await db.execute(sql`select id from assets where id = ${i.parentAssetId}::uuid`)) as unknown as Array<{ id: string }>;
    if (!p.length) throw new FunctionError('ASSET_NOT_FOUND', 'parent asset not found');
  }

  const qr = mintQr();
  const rows = (await db.execute(sql`
    insert into assets
      (org_id, parent_asset_id, code, name, kind, area, location_id, criticality, brand, model, serial_number,
       vendor_id, vendor_contact, purchase_date, warranty_expires_at, warranty_notes, pm_frequencies, specs, qr_token, notes, created_by)
    values
      (${ctx.orgId}::uuid, ${i.parentAssetId ?? null}::uuid, ${i.code}, ${i.name}, ${i.kind}, ${i.area}, ${i.locationId ?? null}::uuid,
       ${i.criticality}, ${i.brand ?? null}, ${i.model ?? null}, ${i.serialNumber ?? null}, ${i.vendorId ?? null}::uuid,
       ${i.vendorContact ?? null}, ${i.purchaseDate ?? null}, ${i.warrantyExpiresAt ?? null}, ${i.warrantyNotes ?? null},
       ${pgTextArray(i.pmFrequencies)}::text[], ${JSON.stringify(i.specs)}::jsonb, ${qr}, ${i.notes ?? null}, ${ctx.actor})
    returning id, code, name, kind, area, criticality, health_status, lifecycle_status, qr_token
  `)) as unknown as Array<Record<string, unknown>>;
  const asset = rows[0];
  await addAssetEvent(db, ctx, { assetId: asset.id as string, eventType: 'instalado', note: 'Alta de equipo' });
  return asset;
}

// ── updateAsset (descriptive fields only) ────────────────────────────────────────────────────────
export const assetPatchInput = z.object({
  assetId: uuid,
  patch: z.object({
    name: z.string().min(1).optional(),
    area: catalog.schema('area_operativa').optional(),
    criticality: catalog.schema('prioridad_equipo').optional(),
    parentAssetId: uuid.nullable().optional(),
    locationId: uuid.nullable().optional(),
    brand: z.string().nullable().optional(),
    model: z.string().nullable().optional(),
    serialNumber: z.string().nullable().optional(),
    vendorId: uuid.nullable().optional(),
    vendorContact: z.string().nullable().optional(),
    purchaseDate: z.string().nullable().optional(),
    warrantyExpiresAt: z.string().nullable().optional(),
    warrantyNotes: z.string().nullable().optional(),
    pmFrequencies: z.array(catalog.schema('frecuencia_preset')).optional(),
    notes: z.string().nullable().optional(),
  }),
});
export type AssetPatchInput = z.infer<typeof assetPatchInput>;

export async function updateAsset(db: DbOrTx, ctx: Context, input: AssetPatchInput) {
  const i = assetPatchInput.parse(input);
  if (!can(ctx, 'equipment.asset.manage')) throw new ForbiddenError('equipment.asset.manage');
  const exists = (await db.execute(sql`select id from assets where id = ${i.assetId}::uuid`)) as unknown as Array<{ id: string }>;
  if (!exists.length) throw new FunctionError('ASSET_NOT_FOUND');

  // Tree-cycle guard: changing the parent must not create a loop (walk up from the new parent).
  if (i.patch.parentAssetId) {
    if (i.patch.parentAssetId === i.assetId) throw new FunctionError('TREE_CYCLE');
    let cur: string | null = i.patch.parentAssetId;
    for (let hops = 0; cur && hops < 64; hops++) {
      if (cur === i.assetId) throw new FunctionError('TREE_CYCLE');
      const up = (await db.execute(sql`select parent_asset_id from assets where id = ${cur}::uuid`)) as unknown as Array<{ parent_asset_id: string | null }>;
      cur = up[0]?.parent_asset_id ?? null;
    }
  }

  const p = i.patch;
  const sets = [
    p.name !== undefined ? sql`name = ${p.name}` : null,
    p.area !== undefined ? sql`area = ${p.area}` : null,
    p.criticality !== undefined ? sql`criticality = ${p.criticality}` : null,
    p.parentAssetId !== undefined ? sql`parent_asset_id = ${p.parentAssetId}::uuid` : null,
    p.locationId !== undefined ? sql`location_id = ${p.locationId}::uuid` : null,
    p.brand !== undefined ? sql`brand = ${p.brand}` : null,
    p.model !== undefined ? sql`model = ${p.model}` : null,
    p.serialNumber !== undefined ? sql`serial_number = ${p.serialNumber}` : null,
    p.vendorId !== undefined ? sql`vendor_id = ${p.vendorId}::uuid` : null,
    p.vendorContact !== undefined ? sql`vendor_contact = ${p.vendorContact}` : null,
    p.purchaseDate !== undefined ? sql`purchase_date = ${p.purchaseDate}` : null,
    p.warrantyExpiresAt !== undefined ? sql`warranty_expires_at = ${p.warrantyExpiresAt}` : null,
    p.warrantyNotes !== undefined ? sql`warranty_notes = ${p.warrantyNotes}` : null,
    p.pmFrequencies !== undefined ? sql`pm_frequencies = ${pgTextArray(p.pmFrequencies)}::text[]` : null,
    p.notes !== undefined ? sql`notes = ${p.notes}` : null,
  ].filter(Boolean) as ReturnType<typeof sql>[];
  if (!sets.length) return { id: i.assetId, updated: false };

  const assignments = sets.reduce((acc, s, idx) => (idx === 0 ? s : sql`${acc}, ${s}`));
  await db.execute(sql`
    update assets set ${assignments}, updated_at = now(), updated_by = ${ctx.actor}
    where id = ${i.assetId}::uuid
  `);
  return { id: i.assetId, updated: true };
}

// ── transitionAssetLifecycle (the §2.1.1 machine; single writer of lifecycle_status) ─────────────
export const lifecycleInput = z.object({
  assetId: uuid,
  to: catalog.schema('estado_registro_activo'),
  note: z.string().max(2000).optional(),
});
export type LifecycleInput = z.infer<typeof lifecycleInput>;

export async function transitionAssetLifecycle(db: DbOrTx, ctx: Context, input: LifecycleInput) {
  const i = lifecycleInput.parse(input);
  if (!can(ctx, 'equipment.asset.manage')) throw new ForbiddenError('equipment.asset.manage');
  const rows = (await db.execute(sql`select id, lifecycle_status from assets where id = ${i.assetId}::uuid`)) as unknown as Array<{ id: string; lifecycle_status: string }>;
  if (!rows.length) throw new FunctionError('ASSET_NOT_FOUND');
  const from = rows[0].lifecycle_status;
  if (from === i.to) return { id: i.assetId, lifecycleStatus: from, changed: false };
  if (!isLegalLifecycle(from, i.to)) throw new FunctionError('INVALID_LIFECYCLE_TRANSITION', `${from} → ${i.to}`);
  if ((i.to === 'inactivo' || i.to === 'baja') && !i.note) throw new FunctionError('NOTE_REQUIRED');
  // §2.1.1 guard: a retire (→ baja) needs no open Tasks referencing the asset. scheduling isn't
  // wired yet, so this guard is a no-op until scheduling-field-service lands (documented degradation).

  const retire = isRetire(i.to);
  await db.execute(sql`
    update assets set lifecycle_status = ${i.to},
      ${retire ? sql`retired_at = now(),` : sql``}
      updated_at = now(), updated_by = ${ctx.actor}
    where id = ${i.assetId}::uuid
  `);
  const eventType = i.to === 'baja' ? 'baja' : i.to === 'activo' ? 'reinstalado' : 'nota';
  await addAssetEvent(db, ctx, { assetId: i.assetId, eventType, note: i.note ?? `Lifecycle ${from} → ${i.to}` });
  return { id: i.assetId, lifecycleStatus: i.to, changed: true };
}

// ── setAssetHealth (the §2.1.2 flat machine; single writer of health_status) ─────────────────────
export const healthInput = z.object({
  assetId: uuid,
  healthStatus: catalog.schema('estado_salud_equipo'),
  note: z.string().max(2000).optional(),
});
export type HealthInput = z.infer<typeof healthInput>;

export async function setAssetHealth(db: DbOrTx, ctx: Context, input: HealthInput) {
  const i = healthInput.parse(input);
  if (!can(ctx, 'equipment.asset.health')) throw new ForbiddenError('equipment.asset.health');
  if (!isHealth(i.healthStatus)) throw new FunctionError('OUT_OF_VOCAB');
  if (healthRequiresNote(i.healthStatus) && !i.note) throw new FunctionError('NOTE_REQUIRED');
  const rows = (await db.execute(sql`select id, health_status from assets where id = ${i.assetId}::uuid`)) as unknown as Array<{ id: string; health_status: string }>;
  if (!rows.length) throw new FunctionError('ASSET_NOT_FOUND');
  await db.execute(sql`
    update assets set health_status = ${i.healthStatus}, health_note = ${i.note ?? null},
      updated_at = now(), updated_by = ${ctx.actor}
    where id = ${i.assetId}::uuid
  `);
  await addAssetEvent(db, ctx, { assetId: i.assetId, eventType: 'alerta', note: i.note ?? `Salud → ${i.healthStatus}` });
  // crítico → dispatch_notification(supervisor) wires when platform-core completions land.
  return { id: i.assetId, healthStatus: i.healthStatus, from: rows[0].health_status };
}

// ── listAssets (the filterable catálogo — demo parity) ───────────────────────────────────────────
export const listAssetsInput = z.object({
  area: z.string().optional(),
  criticality: z.string().optional(),
  healthStatus: z.string().optional(),
  lifecycle: z.string().optional(),
  vendorId: uuid.optional(),
  q: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(15),
});
export type ListAssetsInput = z.infer<typeof listAssetsInput>;

export async function listAssets(db: DbOrTx, ctx: Context, input?: ListAssetsInput) {
  if (!can(ctx, 'equipment.asset.read')) throw new ForbiddenError('equipment.asset.read');
  const f = listAssetsInput.parse(input ?? {});
  const where = sql`
    where ${f.area ? sql`area = ${f.area}` : sql`true`}
      ${f.criticality ? sql`and criticality = ${f.criticality}` : sql``}
      ${f.healthStatus ? sql`and health_status = ${f.healthStatus}` : sql``}
      ${f.lifecycle ? sql`and lifecycle_status = ${f.lifecycle}` : sql`and lifecycle_status <> 'baja'`}
      ${f.vendorId ? sql`and vendor_id = ${f.vendorId}::uuid` : sql``}
      ${f.q ? sql`and (name ilike ${'%' + f.q + '%'} or code ilike ${'%' + f.q + '%'} or brand ilike ${'%' + f.q + '%'})` : sql``}
  `;
  const totalRows = (await db.execute(sql`select count(*)::int as c from assets ${where}`)) as unknown as Array<{ c: number }>;
  const total = totalRows[0]?.c ?? 0;
  const offset = (f.page - 1) * f.pageSize;
  const rows = (await db.execute(sql`
    select id, code, name, kind, area, criticality, health_status, health_note, lifecycle_status,
           brand, vendor_contact, pm_frequencies, last_maintenance_at, location_id
    from assets ${where}
    order by criticality desc, area, code
    limit ${f.pageSize} offset ${offset}
  `)) as unknown as Array<Record<string, unknown>>;
  return { rows, total, page: f.page, pageSize: f.pageSize, pages: Math.max(1, Math.ceil(total / f.pageSize)) };
}

// ── getAssetDetail (the ficha) ───────────────────────────────────────────────────────────────────
export async function getAssetDetail(db: DbOrTx, ctx: Context, input: { assetId: string }) {
  if (!can(ctx, 'equipment.asset.read')) throw new ForbiddenError('equipment.asset.read');
  const id = uuid.parse(input.assetId);
  const a = (await db.execute(sql`
    select id, parent_asset_id, code, name, kind, area, location_id, criticality, health_status, health_note,
           lifecycle_status, brand, model, serial_number, vendor_id, vendor_contact, purchase_date,
           warranty_expires_at, warranty_notes, pm_frequencies, last_maintenance_at, specs, qr_token, notes
    from assets where id = ${id}::uuid
  `)) as unknown as Array<Record<string, unknown>>;
  if (!a.length) throw new FunctionError('ASSET_NOT_FOUND');
  const children = (await db.execute(sql`select id, code, name, criticality, health_status from assets where parent_asset_id = ${id}::uuid order by code`)) as unknown as Array<Record<string, unknown>>;
  const meters = (await db.execute(sql`
    select id, name, meter_type, unit, is_cumulative, min_value, max_value, reading_frequency, current_value, current_value_at, active
    from asset_meters where asset_id = ${id}::uuid and active = true order by name
  `)) as unknown as Array<Record<string, unknown>>;
  const events = (await db.execute(sql`
    select id, event_type, at, actor, note, cost, currency_code from asset_events where asset_id = ${id}::uuid order by at desc limit 20
  `)) as unknown as Array<Record<string, unknown>>;
  const cost = (await db.execute(sql`
    select coalesce(sum(cost), 0)::numeric as total from asset_events
    where asset_id = ${id}::uuid and at >= now() - interval '90 days'
  `)) as unknown as Array<{ total: string }>;
  return { asset: a[0], children, meters, lastEvents: events, cost90d: Number(cost[0]?.total ?? 0) };
}

// ── getAssetByQr / getAsset (light resolver) ─────────────────────────────────────────────────────
export async function getAssetByQr(db: DbOrTx, ctx: Context, input: { qrToken: string }) {
  if (!can(ctx, 'equipment.asset.read')) throw new ForbiddenError('equipment.asset.read');
  const rows = (await db.execute(sql`select id, code, name, area, location_id from assets where qr_token = ${input.qrToken}`)) as unknown as Array<Record<string, unknown>>;
  if (!rows.length) throw new FunctionError('QR_NOT_FOUND');
  return rows[0];
}

/** Minimal one-asset resolver for cross-module soft-uuid validation + label snapshots (G9). The
 *  function OTHER modules (scheduling getTargetLabel, compliance) inject as a dep. */
export async function getAsset(db: DbOrTx, ctx: Context, input: { assetId: string }) {
  if (!can(ctx, 'equipment.asset.read')) throw new ForbiddenError('equipment.asset.read');
  const rows = (await db.execute(sql`select id, code, name from assets where id = ${input.assetId}::uuid`)) as unknown as Array<{ id: string; code: string; name: string }>;
  if (!rows.length) throw new FunctionError('ASSET_NOT_FOUND');
  return { id: rows[0].id, label: `${rows[0].code} — ${rows[0].name}` };
}

// ── recordAssetEvent (manual timeline entry) ─────────────────────────────────────────────────────
export const assetEventInput = z.object({
  assetId: uuid,
  eventType: catalog.schema('tipo_evento_activo'),
  note: z.string().optional(),
  cost: z.number().nullable().optional(),
  currencyCode: z.string().default('MXN').optional(),
  vendorId: uuid.optional(),
  documentId: uuid.optional(),
  trackInFinance: z.boolean().default(false),
});
export type AssetEventInput = z.infer<typeof assetEventInput>;

export async function recordAssetEvent(db: DbOrTx, ctx: Context, input: AssetEventInput) {
  const i = assetEventInput.parse(input);
  if (!can(ctx, 'equipment.asset.manage')) throw new ForbiddenError('equipment.asset.manage');
  const a = (await db.execute(sql`select id from assets where id = ${i.assetId}::uuid`)) as unknown as Array<{ id: string }>;
  if (!a.length) throw new FunctionError('ASSET_NOT_FOUND');
  await addAssetEvent(db, ctx, {
    assetId: i.assetId, eventType: i.eventType, note: i.note ?? null,
    cost: i.cost ?? null, currencyCode: i.cost != null ? i.currencyCode ?? 'MXN' : null,
    vendorId: i.vendorId ?? null, documentId: i.documentId ?? null, trackInFinance: i.trackInFinance,
  });
  return { ok: true };
}
