// equipment-maintenance capabilities — meters + append-only readings + the out-of-range loop-closer
// (spec §4, #11). recordMeterReading is the OFFLINE command target (idempotent replay). The
// out-of-range loop reaches request-intake (createRequest) and the OT creator (createMaintenanceOrder)
// ONLY through injected `deps` (EquipDeps) — both would cycle back to this module, so they are soft
// references resolved at the router/composition root (G24). Absent → the loop degrades to alert-only,
// never blocks. Back-ported from copafix capabilities.ts.
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import type { Context, DbOrTx } from '@astralitics/module-identity-access';
import { can, FunctionError, ForbiddenError } from '@astralitics/module-identity-access';
import { catalog } from '@astralitics/definitions';
import { evaluateRange } from './transitions.js';
import { addAssetEvent } from './_internal.js';

const uuid = z.string().uuid();

/** Resolvers injected by the router (anti-cycle §4.3) so this module never imports request-intake or
 *  the OT creator statically. Absent → outOfRangeToRequest's crear_solicitud/crear_tarea degrade to
 *  alert-only (documented degradation, never a block).
 *
 *  PORT NOTE (wave a): copafix's EquipDeps carried only { createRequest, getFailureCode }; the OT
 *  facet (createMaintenanceOrder / completeMaintenanceOrder / syncPmSchedules / pmCompliance) is
 *  BLOCKED until scheduling-field-service + facility-spaces port (hard imports: triggerTaskFromEvent,
 *  getTask, transition, upsertScheduleRule, updateRule, FRECUENCIA_DIAS, getLocation). The crear_tarea
 *  path is therefore wired through an injected createMaintenanceOrder so the registry slice compiles
 *  standalone; the hard-import version lands with scheduling. */
export interface EquipDeps {
  /** request-intake.createRequest — used by outOfRangeToRequest (crear_solicitud). */
  createRequest?: (input: Record<string, unknown>) => Promise<{ id: string; folio?: string }>;
  /** request-intake.getFailureCode — validates a CatalogoFalla ref on createMaintenanceOrder. */
  getFailureCode?: (id: string) => Promise<{ id: string } | null>;
  /** equipment-maintenance.createMaintenanceOrder — the OT creator (crear_tarea path). Injected
   *  until scheduling-field-service ports and it becomes a co-located capability. */
  createMaintenanceOrder?: (input: Record<string, unknown>) => Promise<{ taskId: string; detailId: string }>;
  /** materials-inventory.consumptionForTask — the named cost seam (§10): real refacciones cost
   *  replaces the manual parts_cost estimate at OT completion when no explicit partsCost is given. */
  consumptionForTask?: (taskId: string) => Promise<{ totalCost: number }>;
}

// ── createMeter ───────────────────────────────────────────────────────────────────────────────────
export const meterCreateInput = z.object({
  assetId: uuid,
  name: z.string().min(1),
  meterType: catalog.schema('tipo_medidor'),
  unit: z.string().min(1),
  isCumulative: z.boolean().default(false),
  minValue: z.number().nullable().optional(),
  maxValue: z.number().nullable().optional(),
  readingFrequency: catalog.schema('frecuencia_preset').optional(),
  outOfRangeAction: catalog.schema('accion_fuera_de_rango').default('crear_solicitud'),
});
export type MeterCreateInput = z.infer<typeof meterCreateInput>;

export async function createMeter(db: DbOrTx, ctx: Context, input: MeterCreateInput) {
  const i = meterCreateInput.parse(input);
  if (!can(ctx, 'equipment.asset.manage')) throw new ForbiddenError('equipment.asset.manage');
  const a = (await db.execute(sql`select id from assets where id = ${i.assetId}::uuid`)) as unknown as Array<{ id: string }>;
  if (!a.length) throw new FunctionError('ASSET_NOT_FOUND');
  const rows = (await db.execute(sql`
    insert into asset_meters (org_id, asset_id, name, meter_type, unit, is_cumulative, min_value, max_value, reading_frequency, out_of_range_action, created_by)
    values (${ctx.orgId}::uuid, ${i.assetId}::uuid, ${i.name}, ${i.meterType}, ${i.unit}, ${i.isCumulative}, ${i.minValue ?? null}, ${i.maxValue ?? null},
            ${i.readingFrequency ?? null}, ${i.outOfRangeAction}, ${ctx.actor})
    returning id, name, meter_type, unit
  `)) as unknown as Array<Record<string, unknown>>;
  return rows[0];
}

// ── recordMeterReading (append-only; offline command target) ─────────────────────────────────────
export const readingInput = z.object({
  meterId: uuid,
  value: z.number(),
  readAt: z.union([z.string(), z.date()]).optional(),
  source: catalog.schema('fuente_lectura').default('manual'),
  note: z.string().optional(),
  photoDocumentId: uuid.optional(),
  idempotencyKey: z.string().min(1).optional(),
});
export type ReadingInput = z.infer<typeof readingInput>;

export async function recordMeterReading(db: DbOrTx, ctx: Context, input: ReadingInput, deps?: EquipDeps) {
  const i = readingInput.parse(input);
  if (!can(ctx, 'equipment.reading.write')) throw new ForbiddenError('equipment.reading.write');

  if (i.idempotencyKey) {
    const dup = (await db.execute(sql`select id, value, out_of_range from meter_readings where idempotency_key = ${i.idempotencyKey} limit 1`)) as unknown as Array<Record<string, unknown>>;
    if (dup.length) return { reading: dup[0], rangeOutcome: { outOfRange: !!dup[0].out_of_range, direction: null }, replayed: true, loop: null };
  }

  const m = (await db.execute(sql`select id, asset_id, min_value, max_value, is_cumulative, current_value, out_of_range_action, active from asset_meters where id = ${i.meterId}::uuid`)) as unknown as Array<{ id: string; asset_id: string; min_value: string | null; max_value: string | null; is_cumulative: boolean; current_value: string | null; out_of_range_action: string; active: boolean }>;
  if (!m.length) throw new FunctionError('METER_NOT_FOUND');
  const meter = m[0];
  if (!meter.active) throw new FunctionError('METER_INACTIVE');

  const range = evaluateRange(meter.min_value == null ? null : Number(meter.min_value), meter.max_value == null ? null : Number(meter.max_value), i.value);
  const rolloverWarning = meter.is_cumulative && meter.current_value != null && i.value < Number(meter.current_value);

  const readAt = i.readAt ? new Date(i.readAt).toISOString() : null;
  const inserted = (await db.execute(sql`
    insert into meter_readings (org_id, meter_id, value, read_at, read_by, source, note, photo_document_id, out_of_range, idempotency_key, created_by)
    values (${ctx.orgId}::uuid, ${i.meterId}::uuid, ${i.value}, ${readAt ?? sql`now()`}, ${ctx.membershipId}::uuid, ${i.source}, ${i.note ?? null},
            ${i.photoDocumentId ?? null}::uuid, ${range.outOfRange}, ${i.idempotencyKey ?? null}, ${ctx.actor})
    returning id, value, read_at, out_of_range
  `)) as unknown as Array<Record<string, unknown>>;
  const reading = inserted[0];

  await db.execute(sql`update asset_meters set current_value = ${i.value}, current_value_at = now(), updated_at = now() where id = ${i.meterId}::uuid`);

  // Close the out-of-range loop per the meter's accion_fuera_de_rango (the loop-closer #11).
  let loop: Awaited<ReturnType<typeof outOfRangeToRequest>> | null = null;
  if (range.outOfRange) loop = await outOfRangeToRequest(db, ctx, { readingId: reading.id as string }, deps);
  return { reading, rangeOutcome: range, rolloverWarning, replayed: false, loop };
}

// ── outOfRangeToRequest (#11) — close the lectura loop per accion_fuera_de_rango ─────────────────
// crear_solicitud → request-intake.createRequest (human triage); crear_tarea → an auto-corrective OT
// (createMaintenanceOrder, injected until scheduling lands); solo_alerta → just degrade the asset to
// alerta. Idempotent per reading (stamps triggered_request_id / triggered_task_id).
export const outOfRangeInput = z.object({ readingId: uuid });
export async function outOfRangeToRequest(db: DbOrTx, ctx: Context, input: z.infer<typeof outOfRangeInput>, deps?: EquipDeps) {
  if (!can(ctx, 'equipment.reading.write')) throw new ForbiddenError('equipment.reading.write');
  const { readingId } = outOfRangeInput.parse(input);
  const rows = (await db.execute(sql`
    select r.id, r.value, r.out_of_range, r.triggered_request_id, r.triggered_task_id,
           m.asset_id, m.name as meter_name, m.unit, m.out_of_range_action, m.corrective_template,
           a.code as asset_code, a.name as asset_name, a.area as asset_area
    from meter_readings r join asset_meters m on m.id = r.meter_id join assets a on a.id = m.asset_id
    where r.id = ${readingId}::uuid for update of r
  `)) as unknown as Array<any>;
  if (!rows.length) throw new FunctionError('READING_NOT_FOUND');
  const rd = rows[0];
  if (!rd.out_of_range) throw new FunctionError('NOT_OUT_OF_RANGE');
  const action = rd.out_of_range_action as string;
  // idempotent per reading — re-firing the same out-of-range reading is a no-op.
  if (rd.triggered_request_id) return { action, requestId: rd.triggered_request_id as string, taskId: null, alreadyTriggered: true };
  if (rd.triggered_task_id) return { action, requestId: null, taskId: rd.triggered_task_id as string, alreadyTriggered: true };

  // every out-of-range reading degrades the asset to alerta (ok→alerta only; never downgrades crítico).
  await db.execute(sql`update assets set health_status = 'alerta', health_note = 'Lectura fuera de rango', updated_at = now() where id = ${rd.asset_id}::uuid and health_status = 'ok'`);
  const label = `${rd.asset_code} — ${rd.asset_name}`;
  const title = `Lectura fuera de rango — ${rd.meter_name} (${rd.value} ${rd.unit ?? ''})`.trim();

  if (action === 'solo_alerta') {
    await addAssetEvent(db, ctx, { assetId: rd.asset_id, eventType: 'alerta', note: title });
    return { action, requestId: null, taskId: null, alerted: true };
  }

  if (action === 'crear_solicitud') {
    if (!deps?.createRequest) { // degradation: no request-intake resolver wired → alert only, never block.
      await addAssetEvent(db, ctx, { assetId: rd.asset_id, eventType: 'alerta', note: title });
      return { action, requestId: null, taskId: null, degraded: true };
    }
    const req = await deps.createRequest({
      title, prioridad: 'urgente', assetId: rd.asset_id, area: rd.asset_area, channel: 'staff', kind: 'incidencia',
      description: `Generada automáticamente por lectura fuera de rango (${label}).`,
    });
    await db.execute(sql`update meter_readings set triggered_request_id = ${req.id}::uuid, updated_at = now() where id = ${readingId}::uuid`);
    await addAssetEvent(db, ctx, { assetId: rd.asset_id, eventType: 'alerta', note: `${title} → incidencia ${req.folio ?? req.id}` });
    return { action, requestId: req.id, taskId: null, folio: req.folio ?? null };
  }

  // crear_tarea → auto-corrective OT (albercas: corrective_template = {trade:'PLO', prioridad:'urgente'}).
  if (!deps?.createMaintenanceOrder) { // degradation: OT creator not wired (scheduling not ported) → alert only.
    await addAssetEvent(db, ctx, { assetId: rd.asset_id, eventType: 'alerta', note: title });
    return { action, requestId: null, taskId: null, degraded: true };
  }
  const ct = rd.corrective_template;
  const tmpl: Record<string, any> = ct ? (typeof ct === 'string' ? JSON.parse(ct) : ct) : {};
  const ot = await deps.createMaintenanceOrder({
    assetId: rd.asset_id, source: 'lectura', meterReadingId: readingId,
    trade: tmpl.trade ?? tmpl.oficio ?? undefined,
    priority: tmpl.prioridad ?? tmpl.priority ?? 'urgente',
    title: tmpl.summary ?? title, dedupeKey: `reading:${readingId}`,
    due: { dueDate: new Date().toISOString().slice(0, 10) }, autoSchedule: true,
    provenance: { module: 'equipment-maintenance', eventKind: 'reading_out_of_range', refId: readingId },
  });
  await db.execute(sql`update meter_readings set triggered_task_id = ${ot.taskId}::uuid, updated_at = now() where id = ${readingId}::uuid`);
  await addAssetEvent(db, ctx, { assetId: rd.asset_id, eventType: 'alerta', note: `${title} → OT` });
  return { action, requestId: null, taskId: ot.taskId, detailId: ot.detailId };
}

// ── listReadings ──────────────────────────────────────────────────────────────────────────────────
export const listReadingsInput = z.object({
  meterId: uuid.optional(),
  assetId: uuid.optional(),
  limit: z.number().int().min(1).max(500).default(100),
});
export async function listReadings(db: DbOrTx, ctx: Context, input?: z.infer<typeof listReadingsInput>) {
  if (!can(ctx, 'equipment.reading.read')) throw new ForbiddenError('equipment.reading.read');
  const f = listReadingsInput.parse(input ?? {});
  const rows = (await db.execute(sql`
    select r.id, r.meter_id, r.value, r.read_at, r.source, r.note, r.out_of_range, m.name as meter_name, m.unit, m.asset_id
    from meter_readings r join asset_meters m on m.id = r.meter_id
    where ${f.meterId ? sql`r.meter_id = ${f.meterId}::uuid` : sql`true`}
      ${f.assetId ? sql`and m.asset_id = ${f.assetId}::uuid` : sql``}
      and r.supersedes_reading_id is null
    order by r.read_at desc
    limit ${f.limit}
  `)) as unknown as Array<Record<string, unknown>>;
  return rows;
}
