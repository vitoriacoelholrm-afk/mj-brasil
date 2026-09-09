// materials-inventory Functions (spec §4) — pure (db, ctx, input, deps?) functions; db is a
// tenant-scoped DbOrTx. Slice 1: the refacción path — catalog (createMaterial/list/get), receiveStock,
// consumeAgainstTask (the Rondo logMaterialUsage verbatim, transactional, with the scheduling.getTask
// guard injected via deps to avoid a hard cycle — G24), reverseMovement (the revive), stockOnHand (SUM
// of the append-only ledger), and consumptionForTask — THE named seam equipment-maintenance.costPerAsset
// consumes (spec §10): real parts cost replaces the manual estimate.
//
// Back-ported from copafix (packages/db/src/materials-inventory/capabilities.ts). The raw
// db.execute(sql`…`) path is kept verbatim; org_id is set explicitly on inserts (no withTenant GUC
// default in the catalog). Re-points: Tx→DbOrTx, identity/_errors→@astralitics/module-identity-access,
// defSchema(NAME)→catalog.schema(NAME).
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import type { Context, DbOrTx } from '@astralitics/module-identity-access';
import { can, FunctionError, ForbiddenError } from '@astralitics/module-identity-access';
import { catalog } from '@astralitics/definitions';
import { applyLotMath } from './transitions.js';

const uuid = z.string().uuid();
const num = (v: unknown) => (v == null ? null : Number(v));
// A Postgres uuid[] array literal as a bound param (values are validated uuids — safe).
const pgUuidArray = (arr: readonly string[]) => `{${arr.join(',')}}`;
// Escape LIKE wildcards so an idempotency-key prefix match is literal.
const likeEscape = (s: string) => s.replace(/[\\%_]/g, (c) => '\\' + c);

// Injected deps (spec §4.3) — the chassis wires these at the router so capabilities never hard-import
// scheduling/equipment (acyclic; G24). getTask is non-negotiable for consumeAgainstTask.
export interface MaterialsDeps {
  getTask?: (db: DbOrTx, ctx: Context, input: { taskId: string }) => Promise<{ status: string } & Record<string, unknown>>;
}

const CONSUMABLE_TASK_STATUS = new Set(['in_progress', 'on_hold', 'completed']); // Rondo set + on_hold

// ════════════════════════════════════════════ CATALOG ═══════════════════════════════════════════
export const materialCreateInput = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  kind: catalog.schema('material_kind'),
  category: catalog.schema('material_categoria').optional(),
  unitOfMeasure: catalog.schema('unidad_medida').default('pieza'),
  lotTracked: z.boolean().optional(),
  brand: z.string().optional(),
  partNumber: z.string().optional(),
  compatibleAssetIds: z.array(uuid).default([]),
  compatibilityNote: z.string().optional(),
  preferredVendorId: uuid.optional(),
  defaultUnitCost: z.number().nonnegative().nullable().optional(),
  hazardClass: z.string().optional(),
  dosageNote: z.string().optional(),
  notes: z.string().optional(),
});
export type MaterialCreateInput = z.infer<typeof materialCreateInput>;

export async function createMaterial(db: DbOrTx, ctx: Context, input: MaterialCreateInput) {
  const i = materialCreateInput.parse(input);
  if (!can(ctx, 'materials.material.manage')) throw new ForbiddenError('materials.material.manage');
  // lot_tracked default by kind (config lotTracking=by-kind): químico ⇒ true, else false unless overridden.
  const lotTracked = i.lotTracked ?? i.kind === 'quimico';
  const dup = (await db.execute(sql`select id from materials where code = ${i.code} limit 1`)) as unknown as Array<{ id: string }>;
  if (dup.length) throw new FunctionError('DUPLICATE_CODE', `material code '${i.code}' already exists`);
  const rows = (await db.execute(sql`
    insert into materials (org_id, code, name, kind, category, unit_of_measure, lot_tracked, brand, part_number,
      compatible_asset_ids, compatibility_note, preferred_vendor_id, default_unit_cost, hazard_class, dosage_note, notes, created_by)
    values (${ctx.orgId}::uuid, ${i.code}, ${i.name}, ${i.kind}, ${i.category ?? null}, ${i.unitOfMeasure}, ${lotTracked}, ${i.brand ?? null}, ${i.partNumber ?? null},
      ${pgUuidArray(i.compatibleAssetIds)}::uuid[], ${i.compatibilityNote ?? null}, ${i.preferredVendorId ?? null}::uuid,
      ${i.defaultUnitCost ?? null}, ${i.hazardClass ?? null}, ${i.dosageNote ?? null}, ${i.notes ?? null}, ${ctx.membershipId}::uuid)
    returning id, code, name, kind, unit_of_measure, lot_tracked
  `)) as unknown as Array<Record<string, unknown>>;
  return rows[0];
}

export const listMaterialsInput = z.object({
  kind: z.string().optional(), category: z.string().optional(), q: z.string().optional(),
  assetId: uuid.optional(), includeArchived: z.boolean().default(false),
  page: z.number().int().min(1).default(1), pageSize: z.number().int().min(1).max(200).default(50),
});
export async function listMaterials(db: DbOrTx, ctx: Context, input?: z.infer<typeof listMaterialsInput>) {
  if (!can(ctx, 'materials.material.read')) throw new ForbiddenError('materials.material.read');
  const f = listMaterialsInput.parse(input ?? {});
  const where = sql`
    where ${f.includeArchived ? sql`true` : sql`archived_at is null`}
      ${f.kind ? sql`and kind = ${f.kind}` : sql``}
      ${f.category ? sql`and category = ${f.category}` : sql``}
      ${f.assetId ? sql`and ${f.assetId}::uuid = any(compatible_asset_ids)` : sql``}
      ${f.q ? sql`and (name ilike ${'%' + f.q + '%'} or code ilike ${'%' + f.q + '%'} or part_number ilike ${'%' + f.q + '%'})` : sql``}
  `;
  const total = (await db.execute(sql`select count(*)::int c from materials ${where}`)) as unknown as Array<{ c: number }>;
  const rows = (await db.execute(sql`
    select m.id, m.code, m.name, m.kind, m.category, m.unit_of_measure, m.lot_tracked, m.default_unit_cost, m.currency_code,
      coalesce((select sum(qty_delta) from stock_movements s where s.material_id = m.id), 0)::numeric as on_hand
    from materials m ${where} order by m.kind, m.name limit ${f.pageSize} offset ${(f.page - 1) * f.pageSize}
  `)) as unknown as Array<Record<string, unknown>>;
  return { rows: rows.map((r) => ({ ...r, on_hand: num(r.on_hand) })), total: total[0]?.c ?? 0, page: f.page, pageSize: f.pageSize };
}

export async function getMaterial(db: DbOrTx, ctx: Context, input: { materialId: string }) {
  if (!can(ctx, 'materials.material.read')) throw new ForbiddenError('materials.material.read');
  const id = uuid.parse(input.materialId);
  const m = (await db.execute(sql`select * from materials where id = ${id}::uuid`)) as unknown as Array<Record<string, unknown>>;
  if (!m.length) throw new FunctionError('MATERIAL_NOT_FOUND');
  const onHandByLocation = (await db.execute(sql`
    select location_id, sum(qty_delta)::numeric as on_hand from stock_movements where material_id = ${id}::uuid group by location_id
  `)) as unknown as Array<Record<string, unknown>>;
  const lots = (await db.execute(sql`select id, lot_number, received_at, expires_at, qty_received, qty_on_hand, unit_cost, status from material_lots where material_id = ${id}::uuid order by received_at desc`)) as unknown as Array<Record<string, unknown>>;
  const lastMovements = (await db.execute(sql`select id, kind, qty_delta, uom, location_id, task_id, unit_cost, moved_at, note from stock_movements where material_id = ${id}::uuid order by moved_at desc limit 20`)) as unknown as Array<Record<string, unknown>>;
  return { material: m[0], onHandByLocation: onHandByLocation.map((r) => ({ ...r, on_hand: num(r.on_hand) })), lots, lastMovements };
}

// ════════════════════════════════════════════ STOCK ═════════════════════════════════════════════
export const receiveStockInput = z.object({
  materialId: uuid,
  locationId: uuid,
  qty: z.number().positive(),
  unitCost: z.number().nonnegative().nullable().optional(),
  lot: z.object({ lotNumber: z.string().min(1), expiresAt: z.string().optional(), vendorId: uuid.optional() }).optional(),
  note: z.string().optional(),
  idempotencyKey: z.string().min(1).optional(),
});
export async function receiveStock(db: DbOrTx, ctx: Context, input: z.infer<typeof receiveStockInput>) {
  const i = receiveStockInput.parse(input);
  if (!can(ctx, 'materials.stock.receive')) throw new ForbiddenError('materials.stock.receive');
  if (i.idempotencyKey) {
    const dup = (await db.execute(sql`select id, lot_id from stock_movements where idempotency_key = ${i.idempotencyKey} limit 1`)) as unknown as Array<{ id: string; lot_id: string | null }>;
    if (dup.length) return { movement: { id: dup[0].id }, lot: dup[0].lot_id ? { id: dup[0].lot_id } : null, replayed: true };
  }
  const m = (await db.execute(sql`select id, unit_of_measure, lot_tracked, default_unit_cost, currency_code, archived_at from materials where id = ${i.materialId}::uuid`)) as unknown as Array<Record<string, any>>;
  if (!m.length) throw new FunctionError('MATERIAL_NOT_FOUND');
  if (m[0].archived_at) throw new FunctionError('MATERIAL_ARCHIVED');
  const unitCost = i.unitCost ?? (m[0].default_unit_cost != null ? Number(m[0].default_unit_cost) : null);

  let lotId: string | null = null;
  if (m[0].lot_tracked) {
    if (!i.lot) throw new FunctionError('LOT_REQUIRED', 'this material is lot-tracked — a lot is required on receipt');
    const lr = (await db.execute(sql`
      insert into material_lots (org_id, material_id, lot_number, received_at, expires_at, qty_received, qty_on_hand, unit_cost, currency_code, vendor_id, received_location_id, status, created_by)
      values (${ctx.orgId}::uuid, ${i.materialId}::uuid, ${i.lot.lotNumber}, ${new Date().toISOString().slice(0, 10)}, ${i.lot.expiresAt ?? null}, ${i.qty}, ${i.qty}, ${unitCost}, ${m[0].currency_code}, ${i.lot.vendorId ?? null}::uuid, ${i.locationId}::uuid, 'active', ${ctx.membershipId}::uuid)
      returning id
    `)) as unknown as Array<{ id: string }>;
    lotId = lr[0].id;
  }
  const mv = (await db.execute(sql`
    insert into stock_movements (org_id, material_id, lot_id, kind, qty_delta, uom, location_id, unit_cost, currency_code, note, moved_by, idempotency_key, created_by)
    values (${ctx.orgId}::uuid, ${i.materialId}::uuid, ${lotId}::uuid, 'recepcion', ${i.qty}, ${m[0].unit_of_measure}, ${i.locationId}::uuid, ${unitCost}, ${m[0].currency_code}, ${i.note ?? null}, ${ctx.membershipId}::uuid, ${i.idempotencyKey ?? null}, ${ctx.membershipId}::uuid)
    returning id, qty_delta, location_id, lot_id
  `)) as unknown as Array<Record<string, unknown>>;
  return { movement: mv[0], lot: lotId ? { id: lotId } : null, replayed: false };
}

export const consumeAgainstTaskInput = z.object({
  taskId: uuid,
  locationId: uuid.optional(), // default stock point; if absent, resolved per item from the ledger
  items: z.array(z.object({ materialId: uuid, lotId: uuid.optional(), qty: z.number().positive(), locationId: uuid.optional(), doseNote: z.string().optional() })).min(1),
  idempotencyKey: z.string().min(1).optional(),
});

// The stock point to draw from when the caller doesn't name one: the material's location holding the
// most recent positive on-hand (its own ledger — never another module's table).
async function resolveStockLocation(db: DbOrTx, materialId: string): Promise<string | null> {
  const rows = (await db.execute(sql`
    select location_id from stock_movements where material_id = ${materialId}::uuid
    group by location_id having sum(qty_delta) > 0 order by max(moved_at) desc limit 1
  `)) as unknown as Array<{ location_id: string }>;
  if (rows.length) return rows[0].location_id;
  const recv = (await db.execute(sql`select location_id from stock_movements where material_id = ${materialId}::uuid and kind = 'recepcion' order by moved_at desc limit 1`)) as unknown as Array<{ location_id: string }>;
  return recv[0]?.location_id ?? null;
}
export async function consumeAgainstTask(db: DbOrTx, ctx: Context, input: z.infer<typeof consumeAgainstTaskInput>, deps: MaterialsDeps = {}) {
  const i = consumeAgainstTaskInput.parse(input);
  if (!can(ctx, 'materials.stock.consume')) throw new ForbiddenError('materials.stock.consume');
  if (i.idempotencyKey) {
    // each item stores `<key>:<n>`; a prefix match detects the whole command's prior run.
    const dup = (await db.execute(sql`select id from stock_movements where idempotency_key like ${likeEscape(i.idempotencyKey) + ':%'} order by idempotency_key`)) as unknown as Array<{ id: string }>;
    if (dup.length) return { movements: dup, replayed: true };
  }
  // the Task guard is non-negotiable (the Rondo line) — validate live status via the injected getTask.
  if (!deps.getTask) throw new FunctionError('TASK_VALIDATION_UNAVAILABLE', 'getTask dep not wired');
  const task = await deps.getTask(db, ctx, { taskId: i.taskId });
  if (!task || !CONSUMABLE_TASK_STATUS.has(task.status)) throw new FunctionError('TASK_NOT_CONSUMABLE', `task status ${task?.status ?? 'missing'} not in {in_progress,on_hold,completed}`);

  const movements: Array<Record<string, unknown>> = [];
  for (const [n, it] of i.items.entries()) {
    const m = (await db.execute(sql`select id, unit_of_measure, lot_tracked, default_unit_cost, currency_code from materials where id = ${it.materialId}::uuid`)) as unknown as Array<Record<string, any>>;
    if (!m.length) throw new FunctionError('MATERIAL_NOT_FOUND', it.materialId);
    let unitCost = m[0].default_unit_cost != null ? Number(m[0].default_unit_cost) : null;
    let lotId: string | null = null;
    if (m[0].lot_tracked) {
      if (!it.lotId) throw new FunctionError('LOT_REQUIRED', `material ${it.materialId} is lot-tracked`);
      const lot = (await db.execute(sql`select id, status, qty_on_hand, unit_cost from material_lots where id = ${it.lotId}::uuid for update`)) as unknown as Array<Record<string, any>>;
      if (!lot.length) throw new FunctionError('LOT_NOT_FOUND', it.lotId);
      if (lot[0].status !== 'active') throw new FunctionError('LOT_NOT_ACTIVE', `lot is ${lot[0].status}`);
      if (Number(lot[0].qty_on_hand) < it.qty) throw new FunctionError('INSUFFICIENT_LOT_QTY', `lot has ${lot[0].qty_on_hand}, need ${it.qty}`);
      lotId = lot[0].id;
      unitCost = lot[0].unit_cost != null ? Number(lot[0].unit_cost) : unitCost;
    }
    const locationId = it.locationId ?? i.locationId ?? (await resolveStockLocation(db, it.materialId));
    if (!locationId) throw new FunctionError('LOCATION_REQUIRED', `no stock location for material ${it.materialId}`);
    const idem = i.idempotencyKey ? `${i.idempotencyKey}:${n}` : null;
    const mv = (await db.execute(sql`
      insert into stock_movements (org_id, material_id, lot_id, kind, qty_delta, uom, location_id, task_id, unit_cost, currency_code, dose_note, moved_by, idempotency_key, created_by)
      values (${ctx.orgId}::uuid, ${it.materialId}::uuid, ${lotId}::uuid, 'consumo', ${-it.qty}, ${m[0].unit_of_measure}, ${locationId}::uuid, ${i.taskId}::uuid, ${unitCost}, ${m[0].currency_code}, ${it.doseNote ?? null}, ${ctx.membershipId}::uuid, ${idem}, ${ctx.membershipId}::uuid)
      returning id, material_id, lot_id, qty_delta, unit_cost, task_id
    `)) as unknown as Array<Record<string, unknown>>;
    if (lotId) await applyLotDelta(db, lotId, -it.qty);
    movements.push(mv[0]);
  }
  return { movements, replayed: false };
}

export const reverseMovementInput = z.object({ movementId: uuid, reason: z.string().min(1) });
export async function reverseMovement(db: DbOrTx, ctx: Context, input: z.infer<typeof reverseMovementInput>) {
  const i = reverseMovementInput.parse(input);
  if (!can(ctx, 'materials.stock.consume') && !can(ctx, 'materials.stock.adjust')) throw new ForbiddenError('materials.stock.consume');
  const rows = (await db.execute(sql`select * from stock_movements where id = ${i.movementId}::uuid for update`)) as unknown as Array<Record<string, any>>;
  if (!rows.length) throw new FunctionError('MOVEMENT_NOT_FOUND');
  const mv = rows[0];
  if (!['consumo', 'baja', 'ajuste'].includes(mv.kind)) throw new FunctionError('KIND_NOT_REVERSIBLE', mv.kind);
  const already = (await db.execute(sql`select id from stock_movements where reverses_movement_id = ${i.movementId}::uuid limit 1`)) as unknown as Array<{ id: string }>;
  if (already.length) throw new FunctionError('ALREADY_REVERSED');
  const comp = (await db.execute(sql`
    insert into stock_movements (org_id, material_id, lot_id, kind, qty_delta, uom, location_id, task_id, reverses_movement_id, unit_cost, currency_code, note, moved_by, created_by)
    values (${ctx.orgId}::uuid, ${mv.material_id}::uuid, ${mv.lot_id}::uuid, ${mv.kind}, ${-Number(mv.qty_delta)}, ${mv.uom}, ${mv.location_id}::uuid, ${mv.task_id}::uuid, ${i.movementId}::uuid, ${mv.unit_cost}, ${mv.currency_code}, ${'Reversa: ' + i.reason}, ${ctx.membershipId}::uuid, ${ctx.membershipId}::uuid)
    returning id, qty_delta, reverses_movement_id
  `)) as unknown as Array<Record<string, unknown>>;
  if (mv.lot_id) await applyLotDelta(db, mv.lot_id, -Number(mv.qty_delta)); // restore + revive depleted→active
  return comp[0];
}

// ════════════════════════════════════════ READ SEAMS ════════════════════════════════════════════
export async function stockOnHand(db: DbOrTx, ctx: Context, input?: { materialId?: string; locationId?: string; kind?: string }) {
  if (!can(ctx, 'materials.material.read')) throw new ForbiddenError('materials.material.read');
  const rows = (await db.execute(sql`
    select s.material_id, s.location_id, m.name, m.unit_of_measure as uom, sum(s.qty_delta)::numeric as on_hand
    from stock_movements s join materials m on m.id = s.material_id
    where ${input?.materialId ? sql`s.material_id = ${input.materialId}::uuid` : sql`true`}
      ${input?.locationId ? sql`and s.location_id = ${input.locationId}::uuid` : sql``}
      ${input?.kind ? sql`and m.kind = ${input.kind}` : sql``}
    group by s.material_id, s.location_id, m.name, m.unit_of_measure
  `)) as unknown as Array<Record<string, unknown>>;
  return rows.map((r) => ({ ...r, on_hand: num(r.on_hand) }));
}

// THE named seam (spec §10) — real parts cost for a Task, net of reversals. Reversed consumo rows
// carry a positive qty_delta with the same task_id+kind, so SUM nets them out.
export async function consumptionForTask(db: DbOrTx, ctx: Context, input: { taskId: string }) {
  if (!can(ctx, 'materials.material.read')) throw new ForbiddenError('materials.material.read');
  const taskId = uuid.parse(input.taskId);
  const rows = (await db.execute(sql`
    select m.id as material_id, m.name, s.lot_id, l.lot_number, s.uom,
      (-sum(s.qty_delta))::numeric as qty,
      (-sum(s.qty_delta * coalesce(s.unit_cost, 0)))::numeric as line_cost,
      max(coalesce(s.unit_cost, 0))::numeric as unit_cost,
      max(s.currency_code) as currency
    from stock_movements s join materials m on m.id = s.material_id
    left join material_lots l on l.id = s.lot_id
    where s.task_id = ${taskId}::uuid and s.kind = 'consumo'
    group by m.id, m.name, s.lot_id, l.lot_number, s.uom
    having -sum(s.qty_delta) <> 0
    order by m.name
  `)) as unknown as Array<Record<string, unknown>>;
  const lines = rows.map((r) => ({
    materialId: r.material_id, name: r.name, lotNumber: r.lot_number, qty: num(r.qty), uom: r.uom,
    unitCost: num(r.unit_cost), lineCost: num(r.line_cost),
  }));
  const totalCost = lines.reduce((s, l) => s + (l.lineCost ?? 0), 0);
  const currency = (rows[0]?.currency as string) ?? 'MXN';
  return { lines, totalCost, currency };
}

// ════════════════════════════════════════ INTERNAL ══════════════════════════════════════════════
// applyLotDelta — the transactional heart (Rondo verbatim): decrement/restore qty_on_hand + the
// auto-flip active→depleted at zero and revive depleted→active. The ONLY writer of those aristas.
export async function applyLotDelta(db: DbOrTx, lotId: string, delta: number) {
  const rows = (await db.execute(sql`select qty_on_hand, status from material_lots where id = ${lotId}::uuid for update`)) as unknown as Array<{ qty_on_hand: string; status: string }>;
  if (!rows.length) throw new FunctionError('LOT_NOT_FOUND');
  const { onHand, status } = applyLotMath(Number(rows[0].qty_on_hand), delta, rows[0].status);
  await db.execute(sql`update material_lots set qty_on_hand = ${onHand}, status = ${status}, updated_at = now() where id = ${lotId}::uuid`);
  return { onHand, status };
}
