// equipment-maintenance — the OT facet ("wave b"): createMaintenanceOrder (the shared OT *creator*,
// consumed laterally by request-intake/vendor/compliance), completeMaintenanceOrder (close facet →
// complete Task → cost rolls back to the asset as ONE AssetEvent), syncPmSchedules (pm_frequencies →
// ScheduleRules), pmCompliance (the on-time KPI), getMaintenanceOrder (the satellite read).
//
// Back-ported from copafix (packages/db/src/equipment-maintenance/capabilities.ts). The cross-module
// shape follows G24 (CONVENTIONS §4 — import down, inject up):
//   • HARD imports DOWN: scheduling-field-service (the Task lifecycle machine) + facility-spaces
//     (getLocation, for the injected target-label resolver) — both are lower/peer and never import us.
//   • INJECTED UP: request-intake's createRequest/getFailureCode arrive via EquipDeps, wired at the
//     router (request-intake is the higher-level caller; it hard-imports our createMaintenanceOrder).
// db arrives already tenant-scoped (RLS is the installed-app runtime's job, not the capability's).
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { can, FunctionError, ForbiddenError } from '@astralitics/module-identity-access';
import type { Context, DbOrTx } from '@astralitics/module-identity-access';
import { catalog } from '@astralitics/definitions';
import {
  triggerTaskFromEvent, transition, getTask, upsertScheduleRule, updateRule,
  FRECUENCIA_DIAS, type SchedDeps,
} from '@astralitics/module-scheduling-field-service';
import { getLocation } from '@astralitics/module-facility-spaces';
import { addAssetEvent } from './_internal.js';
import { getAsset } from './assets.js';
import type { EquipDeps } from './meters.js';

const uuid = z.string().uuid();

/** Sources whose OT is corrective (diagnosis required at completion; AssetEvent type = reparacion). */
const CORRECTIVE_SOURCES = new Set(['incidencia', 'lectura', 'recorrido', 'revision_habitacion']);
/** origen_ot → the Task's source_event_kind (provenance for the board / downstream loops). */
const EVENT_KIND_FOR_SOURCE: Record<string, string> = {
  incidencia: 'request_triaged', lectura: 'reading_out_of_range', preventivo: 'pm_due',
  recorrido: 'ronda_finding', revision_habitacion: 'pm_item_failed', evento: 'event_setup',
  os_proveedor: 'os_repair_scheduled', manual: 'manual_ot',
};

/** The SchedDeps this module passes to triggerTaskFromEvent — the target label resolved via our own
 *  getAsset + facility-spaces.getLocation (both hard imports DOWN; no cycle). */
function equipSchedDeps(db: DbOrTx, ctx: Context): SchedDeps {
  return {
    getTargetLabel: async (kind, id) => {
      try { return kind === 'asset' ? (await getAsset(db, ctx, { assetId: id })).label : (await getLocation(db, ctx, { id })).label; }
      catch { return null; }
    },
  };
}

// ── createMaintenanceOrder (#8) — the shared OT creator: Task (via the machine) + 1:1 satellite ───
export const createMaintenanceOrderInput = z.object({
  assetId: uuid.optional(),
  locationRef: uuid.optional(),
  trade: catalog.schema('oficio').optional(),
  source: catalog.schema('origen_ot').default('manual'),
  requestId: uuid.optional(),
  failureCodeId: uuid.optional(),
  vendorServiceOrderId: uuid.optional(),
  meterReadingId: uuid.optional(),
  checklistItemRef: z.string().optional(),
  priority: catalog.schema('prioridad').default('normal'),
  title: z.string().min(1),
  description: z.string().optional(),
  dedupeKey: z.string().min(1),
  due: z.object({
    dueDate: z.string().optional(),
    dueAt: z.string().optional(),
    slaMinutes: z.number().int().optional(),
    scheduledDate: z.string().optional(),
  }),
  assigneeId: uuid.optional(),
  autoSchedule: z.boolean().optional(),
  // Task provenance (source_module/event/ref). Defaults to this module; request-intake/vendor pass
  // their own so the board shows where the OT actually originated.
  provenance: z.object({ module: z.string().optional(), eventKind: z.string().optional(), refId: uuid.optional() }).optional(),
  payload: z.record(z.unknown()).optional(),
});
export type CreateMaintenanceOrderInput = z.infer<typeof createMaintenanceOrderInput>;

export async function createMaintenanceOrder(db: DbOrTx, ctx: Context, input: CreateMaintenanceOrderInput, deps?: EquipDeps) {
  const i = createMaintenanceOrderInput.parse(input);
  if (!can(ctx, 'equipment.ot.create')) throw new ForbiddenError('equipment.ot.create');
  if (!i.assetId && !i.locationRef) throw new FunctionError('MISSING_TARGET', 'assetId or locationRef required');

  // guard: no OT against a retired asset.
  if (i.assetId) {
    const a = (await db.execute(sql`select id, lifecycle_status from assets where id = ${i.assetId}::uuid`)) as unknown as Array<{ id: string; lifecycle_status: string }>;
    if (!a.length) throw new FunctionError('ASSET_NOT_FOUND');
    if (a[0].lifecycle_status === 'baja') throw new FunctionError('GUARD_FAILED', 'asset is baja (retired)');
  }
  // validate the failure code via the injected resolver (request-intake owns CatalogoFalla).
  if (i.failureCodeId && deps?.getFailureCode) {
    const f = await deps.getFailureCode(i.failureCodeId);
    if (!f) throw new FunctionError('INVALID_FAILURE_CODE');
  }

  // map slaMinutes → an absolute dueAt (triggerTaskFromEvent takes dueDate|dueAt).
  let dueAt = i.due.dueAt;
  if (i.due.slaMinutes != null) dueAt = new Date(Date.now() + i.due.slaMinutes * 60000).toISOString();
  if (!i.due.dueDate && !dueAt) throw new FunctionError('DUE_REQUIRED');

  const target = i.assetId ? { kind: 'asset' as const, id: i.assetId } : { kind: 'location' as const, id: i.locationRef! };
  const prov = i.provenance ?? {};
  const trig = await triggerTaskFromEvent(db, ctx, {
    source: {
      module: prov.module ?? 'equipment-maintenance',
      eventKind: prov.eventKind ?? EVENT_KIND_FOR_SOURCE[i.source] ?? 'manual_ot',
      refId: prov.refId ?? i.requestId ?? i.meterReadingId,
    },
    dedupeKey: i.dedupeKey,
    kind: 'ot',
    target,
    due: { dueDate: i.due.dueDate, dueAt, scheduledDate: i.due.scheduledDate ?? i.due.dueDate },
    priority: i.priority,
    title: i.title,
    description: i.description,
    payload: { ...(i.payload ?? {}), source: i.source, failureCodeId: i.failureCodeId, requestId: i.requestId },
    assign: i.assigneeId ? { membershipId: i.assigneeId, autoSchedule: i.autoSchedule } : (i.autoSchedule ? { autoSchedule: true } : undefined),
  } as Parameters<typeof triggerTaskFromEvent>[2], equipSchedDeps(db, ctx));
  const taskId = trig.task.id as string;

  // satellite 1:1 on the Task (idempotent on (org_id, task_id) — replaying the same event is a no-op).
  const ins = (await db.execute(sql`
    insert into maintenance_order_details
      (org_id, task_id, asset_id, location_ref, trade, source, request_id, failure_code_id, vendor_service_order_id, meter_reading_id, checklist_item_ref, created_by)
    values
      (${ctx.orgId}::uuid, ${taskId}::uuid, ${i.assetId ?? null}::uuid, ${i.locationRef ?? null}::uuid, ${i.trade ?? null}, ${i.source},
       ${i.requestId ?? null}::uuid, ${i.failureCodeId ?? null}::uuid, ${i.vendorServiceOrderId ?? null}::uuid,
       ${i.meterReadingId ?? null}::uuid, ${i.checklistItemRef ?? null}, ${ctx.membershipId}::uuid)
    on conflict (org_id, task_id) do nothing
    returning id
  `)) as unknown as Array<{ id: string }>;
  let detailId: string;
  if (ins.length) detailId = ins[0].id;
  else {
    const ex = (await db.execute(sql`select id from maintenance_order_details where task_id = ${taskId}::uuid`)) as unknown as Array<{ id: string }>;
    detailId = ex[0].id;
  }
  return { taskId, detailId, taskCreated: trig.created, task: trig.task };
}

// ── completeMaintenanceOrder (#9) — close the facet, complete the Task, cost → the asset ─────────
export const completeMaintenanceOrderInput = z.object({
  taskId: uuid,
  diagnosis: z.string().optional(),
  rootCause: z.string().optional(),
  failureCodeId: uuid.optional(),
  trade: catalog.schema('oficio').optional(),
  laborMinutes: z.number().int().optional(),
  partsCost: z.number().nullable().optional(),
  externalCost: z.number().nullable().optional(),
  currencyCode: z.string().default('MXN').optional(),
  vendorId: uuid.optional(),
  completedSummary: z.string().optional(),
  outcomeNote: z.string().optional(),
  idempotencyKey: z.string().min(1).optional(),
});
export type CompleteMaintenanceOrderInput = z.infer<typeof completeMaintenanceOrderInput>;

export async function completeMaintenanceOrder(db: DbOrTx, ctx: Context, input: CompleteMaintenanceOrderInput, deps: EquipDeps = {}) {
  const i = completeMaintenanceOrderInput.parse(input);
  if (!can(ctx, 'equipment.ot.complete')) throw new ForbiddenError('equipment.ot.complete');

  if (i.idempotencyKey) {
    const dup = (await db.execute(sql`select id, asset_id, task_id from maintenance_order_details where complete_idempotency_key = ${i.idempotencyKey} limit 1`)) as unknown as Array<{ id: string; asset_id: string | null; task_id: string }>;
    if (dup.length) return { detailId: dup[0].id, taskId: dup[0].task_id, status: 'completed', replayed: true };
  }

  const rows = (await db.execute(sql`select * from maintenance_order_details where task_id = ${i.taskId}::uuid for update`)) as unknown as Array<Record<string, unknown>>;
  if (!rows.length) throw new FunctionError('MAINTENANCE_ORDER_NOT_FOUND');
  const mod = rows[0] as { id: string; source: string; asset_id: string | null };
  if (CORRECTIVE_SOURCES.has(mod.source) && !i.diagnosis) throw new FunctionError('DIAGNOSIS_REQUIRED');

  // the Task must be in_progress (read its live state via scheduling — never its table).
  const task = await getTask(db, ctx, { taskId: i.taskId });
  if (task.status !== 'in_progress') throw new FunctionError('INVALID_TRANSITION', `task is ${task.status}, expected in_progress`);

  // materials seam (§10 — "estimated → computed"): when no explicit partsCost is given, derive it
  // from the real refacciones consumed against this Task (materials-inventory.consumptionForTask,
  // injected at the router). No dep / no consumption → stays null. The total then rolls to the asset
  // as ONE AssetEvent below, which costPerAsset sums.
  let partsCost = i.partsCost ?? null;
  if (partsCost == null && deps?.consumptionForTask) {
    const consumed = await deps.consumptionForTask(i.taskId);
    if (consumed && consumed.totalCost > 0) partsCost = consumed.totalCost;
  }
  const externalCost = i.externalCost ?? null;
  await db.execute(sql`
    update maintenance_order_details set
      diagnosis = coalesce(${i.diagnosis ?? null}, diagnosis),
      root_cause = coalesce(${i.rootCause ?? null}, root_cause),
      failure_code_id = coalesce(${i.failureCodeId ?? null}::uuid, failure_code_id),
      trade = coalesce(${i.trade ?? null}, trade),
      labor_minutes = ${i.laborMinutes ?? null},
      parts_cost = ${partsCost}, external_cost = ${externalCost}, currency_code = ${i.currencyCode ?? 'MXN'},
      completed_summary = ${i.completedSummary ?? null},
      complete_idempotency_key = coalesce(${i.idempotencyKey ?? null}, complete_idempotency_key),
      updated_at = now(), updated_by = ${ctx.membershipId}::uuid
    where id = ${mod.id}::uuid
  `);

  // close the facet → transition the Task (verification gate keeps OTs at 'completed' for a verifier).
  await transition(db, ctx, { taskId: i.taskId, to: 'completed', outcomeNote: i.outcomeNote });

  // the cost rolls back to the asset: ONE AssetEvent carries the total (the canonical money row that
  // costPerAsset sums); the satellite keeps the parts/external breakdown for the OT detail view.
  const cost = (partsCost ?? 0) + (externalCost ?? 0);
  if (mod.asset_id) {
    const eventType = CORRECTIVE_SOURCES.has(mod.source) ? 'reparacion' : 'servicio';
    await addAssetEvent(db, ctx, {
      assetId: mod.asset_id, eventType,
      note: i.completedSummary ?? i.diagnosis ?? null,
      cost: cost > 0 ? cost : null, currencyCode: cost > 0 ? (i.currencyCode ?? 'MXN') : null,
      vendorId: i.vendorId ?? null, taskId: i.taskId,
      trackInFinance: (externalCost ?? 0) > 0,
    });
    await db.execute(sql`update assets set last_maintenance_at = now(), updated_at = now() where id = ${mod.asset_id}::uuid`);
  }
  return { detailId: mod.id, taskId: i.taskId, status: 'completed', cost, replayed: false };
}

// ── syncPmSchedules (#17) — pm_frequencies → ScheduleRules (one per frequency), cancel removed ───
export async function syncPmSchedules(db: DbOrTx, ctx: Context, input: { assetId: string }) {
  const assetId = uuid.parse(input.assetId);
  if (!can(ctx, 'equipment.asset.manage')) throw new ForbiddenError('equipment.asset.manage');
  const a = (await db.execute(sql`select id, name, pm_frequencies, purchase_date from assets where id = ${assetId}::uuid`)) as unknown as Array<{ id: string; name: string; pm_frequencies: string[]; purchase_date: string | null }>;
  if (!a.length) throw new FunctionError('ASSET_NOT_FOUND');
  const freqs = a[0].pm_frequencies ?? [];
  const startDate = a[0].purchase_date ?? new Date().toISOString().slice(0, 10);

  const ruleRefs: Array<{ frequency: string; ruleId: string }> = [];
  const wanted = new Set<string>();
  for (const freq of freqs) {
    const days = FRECUENCIA_DIAS[freq];
    if (!days) continue; // unknown preset → skip (never silently mis-schedule)
    const sourceKey = `equipment:${assetId}:${freq}`;
    wanted.add(sourceKey);
    const { ruleId } = await upsertScheduleRule(db, ctx, {
      sourceKey,
      rule: {
        name: `PM ${freq} — ${a[0].name}`, description: `Mantenimiento preventivo ${freq}`,
        kind: 'ot', scheduleMode: 'fixed', defaultFrequencyDays: days, startDate, status: 'active',
        defaultPriority: 'normal', defaultPayload: { assetId, frequency: freq },
      },
      items: [{ targetKind: 'asset', assetId }],
      // the rule shape is a partial — upsertScheduleRule.parse() fills the remaining defaults at runtime.
    } as unknown as Parameters<typeof upsertScheduleRule>[2]);
    ruleRefs.push({ frequency: freq, ruleId });
  }
  // cancel rules for frequencies removed from the asset (read this asset's rules by source-key prefix).
  let cancelled = 0;
  const existing = (await db.execute(sql`select id, source_key from schedule_rules where source_key like ${'equipment:' + assetId + ':%'} and status not in ('cancelled','expired')`)) as unknown as Array<{ id: string; source_key: string }>;
  for (const r of existing) {
    if (!wanted.has(r.source_key)) { await updateRule(db, ctx, { ruleId: r.id, status: 'cancelled' }); cancelled++; }
  }
  return { ruleRefs, cancelled };
}

// ── pmCompliance (#14) — PM compliance % over the PM tasks generated for this module's assets ────
export const pmComplianceInput = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  area: z.string().optional(),
  assetId: uuid.optional(),
});
export async function pmCompliance(db: DbOrTx, ctx: Context, input?: z.infer<typeof pmComplianceInput>) {
  if (!can(ctx, 'equipment.kpi.read')) throw new ForbiddenError('equipment.kpi.read');
  const f = pmComplianceInput.parse(input ?? {});
  const from = f.from ?? '1900-01-01';
  const to = f.to ?? new Date().toISOString().slice(0, 10);
  const todayIso = new Date().toISOString().slice(0, 10);
  // PM tasks = ot Tasks generated from a rule this module owns (source_key like 'equipment:%').
  const rows = (await db.execute(sql`
    select t.id, t.due_date, t.completed_at, t.status, t.asset_id, coalesce(a.area, 'sin_area') as area, coalesce(r.grace_days, 2) as grace_days
    from tasks t
    join schedule_rules r on r.id = t.schedule_rule_id and r.source_key like 'equipment:%'
    left join assets a on a.id = t.asset_id
    where t.kind = 'ot' and t.due_date is not null and t.due_date between ${from} and ${to}
      ${f.assetId ? sql`and t.asset_id = ${f.assetId}::uuid` : sql``}
      ${f.area ? sql`and a.area = ${f.area}` : sql``}
  `)) as unknown as Array<{ id: string; due_date: string; completed_at: string | null; status: string; asset_id: string | null; area: string; grace_days: number }>;

  const byArea: Record<string, { area: string; due: number; onTime: number; late: number; missed: number }> = {};
  const bump = (area: string) => (byArea[area] ??= { area, due: 0, onTime: 0, late: 0, missed: 0 });
  let due = 0, onTime = 0, late = 0, missed = 0;
  for (const t of rows) {
    due++; const ar = bump(t.area); ar.due++;
    const done = (t.status === 'completed' || t.status === 'closed') && t.completed_at;
    if (done) {
      const diff = Math.round((new Date(t.completed_at as string).getTime() - new Date(t.due_date + 'T00:00:00Z').getTime()) / 86400000);
      if (Math.abs(diff) <= Number(t.grace_days)) { onTime++; ar.onTime++; } else { late++; ar.late++; }
    } else if (t.due_date < todayIso) { missed++; ar.missed++; }
  }
  const resolved = onTime + late + missed; // tasks that have come due (excludes not-yet-due open ones)
  const pct = resolved ? Math.round((onTime / resolved) * 100) : null;
  return {
    pct, due, completedOnTime: onTime, late, missed, pending: due - resolved,
    byArea: Object.values(byArea).map((b) => {
      const r = b.onTime + b.late + b.missed;
      return { ...b, pct: r ? Math.round((b.onTime / r) * 100) : null };
    }),
  };
}

// ── getMaintenanceOrder (the satellite read, for the OT panel mounted in the Task detail) ────────
export async function getMaintenanceOrder(db: DbOrTx, ctx: Context, input: { taskId: string }) {
  if (!can(ctx, 'equipment.asset.read')) throw new ForbiddenError('equipment.asset.read');
  const taskId = uuid.parse(input.taskId);
  const rows = (await db.execute(sql`select * from maintenance_order_details where task_id = ${taskId}::uuid`)) as unknown as Array<Record<string, unknown>>;
  return rows[0] ?? null;
}
