// scheduling-field-service Functions (spec §4) — pure (db, ctx, input, deps?) functions; `db` is
// a tenant-scoped DbOrTx (the RLS/withTenant chokepoint is the installed-app runtime's job; the
// catalog capability receives an already-scoped handle, same as identity-access). THE shared Task
// machine: the recurrence engine (generateTasks, ported from Rondo generateVisits), the single
// status writer (transition), the loop-closer (triggerTaskFromEvent), the daily board, and
// assignment. Target-label resolution comes in via `deps` (the anti-cycle pattern §4.3):
// equipment-maintenance consumes us, so we never import it.
//
// Back-ported from copafix VERBATIM; the only rewrites are the import/call re-points:
//   '../chassis/withTenant.js' (Tx)            → '@astralitics/module-identity-access' (DbOrTx)
//   '../identity/context.js' (Context,can,...) → '@astralitics/module-identity-access'
//   '../_errors.js' (FunctionError)          → '@astralitics/module-identity-access'
//   '../_vocabulary.js' (defSchema)            → '@astralitics/definitions' → catalog.schema('<name>')
//   './transitions.js'                         → './transitions.js'
// SECURITY NOTE: listTasks builds the status/kind IN-lists via sql.raw with a naive quote-strip;
// this is a faithful port of the copafix vector (flagged in the back-port self-report) — the
// recommended hardening is parameterized inArray/sql.array.
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import type { Context, DbOrTx } from '@astralitics/module-identity-access';
import { can, FunctionError, ForbiddenError } from '@astralitics/module-identity-access';
import { catalog } from '@astralitics/definitions';
import {
  isLegalTransition, isTaskTerminal, needsVerification, legalNext, isLegalRuleTransition,
  computeNextDueDates, toIsoDate, addDays, minIso, parseIsoDate,
} from './transitions.js';

const uuid = z.string().uuid();
const today = () => new Date().toISOString().slice(0, 10);
const actorOf = (ctx: Context) => (ctx.membershipId ? `member:${ctx.membershipId}` : ctx.actor ?? 'app');

/** Optional resolvers injected by the router (anti-cycle §4.3). Absent → target_label = null. */
export interface SchedDeps { getTargetLabel?: (targetKind: string, id: string) => Promise<string | null> }

async function resolveLabel(deps: SchedDeps | undefined, targetKind: string | null, locationId: string | null, assetId: string | null): Promise<string | null> {
  if (!deps?.getTargetLabel || !targetKind) return null;
  const id = targetKind === 'asset' ? assetId : locationId;
  if (!id) return null;
  try { return await deps.getTargetLabel(targetKind, id); } catch { return null; }
}

// ════════════════════════════════════════ SCHEDULE RULES ════════════════════════════════════════
const scopeItem = z.object({
  targetKind: catalog.schema('target_kind'),
  locationId: uuid.optional(),
  assetId: uuid.optional(),
  frequencyDaysOverride: z.number().int().optional(),
  anchorDate: z.string().optional(),
  payloadOverride: z.record(z.unknown()).optional(),
});
export const upsertRuleInput = z.object({
  sourceKey: z.string().optional(),
  rule: z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    kind: catalog.schema('task_kind'),
    scheduleMode: catalog.schema('schedule_mode').default('fixed'),
    defaultFrequencyDays: z.number().int().min(1).default(30),
    leadTimeDays: z.number().int().min(0).default(14),
    graceDays: z.number().int().min(0).default(2),
    duplicateSuppression: catalog.schema('duplicate_suppression').default('while_open'),
    autoSchedule: z.boolean().default(false),
    startDate: z.string(),
    endDate: z.string().optional(),
    status: catalog.schema('schedule_rule_status').optional(),
    defaultPriority: catalog.schema('prioridad').default('normal'),
    defaultEstimatedMinutes: z.number().int().optional(),
    defaultPayload: z.record(z.unknown()).default({}),
  }),
  items: z.array(scopeItem).default([]),
});
export type UpsertRuleInput = z.infer<typeof upsertRuleInput>;

export async function upsertScheduleRule(db: DbOrTx, ctx: Context, input: UpsertRuleInput) {
  const i = upsertRuleInput.parse(input);
  if (!can(ctx, 'scheduling.rules.manage')) throw new ForbiddenError('scheduling.rules.manage');
  const r = i.rule;

  let ruleId: string;
  let created = false;
  const existing = i.sourceKey
    ? ((await db.execute(sql`select id from schedule_rules where source_key = ${i.sourceKey}`)) as unknown as Array<{ id: string }>)
    : [];
  if (existing.length) {
    ruleId = existing[0].id;
    await db.execute(sql`
      update schedule_rules set name=${r.name}, description=${r.description ?? null}, schedule_mode=${r.scheduleMode},
        default_frequency_days=${r.defaultFrequencyDays}, lead_time_days=${r.leadTimeDays}, grace_days=${r.graceDays},
        duplicate_suppression=${r.duplicateSuppression}, auto_schedule=${r.autoSchedule}, start_date=${r.startDate}, end_date=${r.endDate ?? null},
        ${r.status ? sql`status=${r.status},` : sql``} default_priority=${r.defaultPriority}, default_payload=${JSON.stringify(r.defaultPayload)}::jsonb,
        updated_at=now(), updated_by=${ctx.membershipId}::uuid
      where id=${ruleId}::uuid`);
    // declaratively reconcile items: archive live items, re-insert the listed set.
    await db.execute(sql`update schedule_rule_items set archived_at = now() where rule_id = ${ruleId}::uuid and archived_at is null`);
  } else {
    const rows = (await db.execute(sql`
      insert into schedule_rules (name, description, kind, schedule_mode, default_frequency_days, lead_time_days, grace_days,
        duplicate_suppression, auto_schedule, start_date, end_date, status, default_priority, default_estimated_minutes, default_payload, source_key, created_by)
      values (${r.name}, ${r.description ?? null}, ${r.kind}, ${r.scheduleMode}, ${r.defaultFrequencyDays}, ${r.leadTimeDays}, ${r.graceDays},
        ${r.duplicateSuppression}, ${r.autoSchedule}, ${r.startDate}, ${r.endDate ?? null}, ${r.status ?? 'draft'}, ${r.defaultPriority},
        ${r.defaultEstimatedMinutes ?? null}, ${JSON.stringify(r.defaultPayload)}::jsonb, ${i.sourceKey ?? null}, ${ctx.membershipId}::uuid)
      returning id`)) as unknown as Array<{ id: string }>;
    ruleId = rows[0].id;
    created = true;
  }

  for (const it of i.items) {
    if ((it.targetKind === 'location') === !!it.assetId) throw new FunctionError('INVALID_ITEM_TARGET', 'exactly one of location/asset per target_kind');
    await db.execute(sql`
      insert into schedule_rule_items (rule_id, target_kind, location_id, asset_id, frequency_days_override, anchor_date, payload_override, created_by)
      values (${ruleId}::uuid, ${it.targetKind}, ${it.locationId ?? null}::uuid, ${it.assetId ?? null}::uuid, ${it.frequencyDaysOverride ?? null},
        ${it.anchorDate ?? null}, ${it.payloadOverride ? JSON.stringify(it.payloadOverride) : null}::jsonb, ${ctx.membershipId}::uuid)`);
  }
  return { ruleId, created };
}

export async function updateRule(db: DbOrTx, ctx: Context, input: { ruleId: string; status?: string; patch?: Record<string, unknown> }) {
  const ruleId = uuid.parse(input.ruleId);
  if (!can(ctx, 'scheduling.rules.manage')) throw new ForbiddenError('scheduling.rules.manage');
  const rows = (await db.execute(sql`select id, status from schedule_rules where id = ${ruleId}::uuid`)) as unknown as Array<{ id: string; status: string }>;
  if (!rows.length) throw new FunctionError('RULE_NOT_FOUND');
  if (input.status) {
    const to = catalog.schema('schedule_rule_status').parse(input.status);
    if (rows[0].status !== to) {
      if (!isLegalRuleTransition(rows[0].status, to)) throw new FunctionError('INVALID_RULE_TRANSITION', `${rows[0].status} → ${to}`);
      if (to === 'active') {
        const items = (await db.execute(sql`select count(*)::int c from schedule_rule_items where rule_id = ${ruleId}::uuid and archived_at is null`)) as unknown as Array<{ c: number }>;
        if (!items[0]?.c) throw new FunctionError('NO_ANCHORED_ITEMS', 'a rule needs ≥1 item to activate');
      }
      await db.execute(sql`update schedule_rules set status = ${to}, updated_at = now(), updated_by = ${ctx.membershipId}::uuid where id = ${ruleId}::uuid`);
    }
  }
  return { id: ruleId, status: input.status ?? rows[0].status };
}

// ════════════════════════════════ generateTasks (Rondo generateVisits port) ═════════════════════
export const generateTasksInput = z.object({ ruleId: uuid.optional(), throughDate: z.string().optional(), dryRun: z.boolean().optional() });
export async function generateTasks(db: DbOrTx, ctx: Context, input?: z.infer<typeof generateTasksInput>, deps?: SchedDeps) {
  const i = generateTasksInput.parse(input ?? {});
  if (!can(ctx, 'scheduling.rules.generate')) throw new ForbiddenError('scheduling.rules.generate');

  const rules = (await db.execute(
    i.ruleId
      ? sql`select * from schedule_rules where id = ${i.ruleId}::uuid`
      : sql`select * from schedule_rules where status = 'active'`,
  )) as unknown as Array<any>;
  if (i.ruleId && !rules.length) throw new FunctionError('RULE_NOT_FOUND');
  if (i.ruleId && rules[0].status !== 'active') throw new FunctionError('RULE_NOT_ACTIVE');

  let generated = 0, skipped = 0, suppressed = 0;
  const unanchored: string[] = [];
  const perRule: any[] = [];

  for (const rule of rules.filter((r) => r.status === 'active')) {
    const through = minIso(i.throughDate ?? toIsoDate(addDays(parseIsoDate(today()), rule.lead_time_days)), rule.end_date);
    const items = (await db.execute(sql`select * from schedule_rule_items where rule_id = ${rule.id}::uuid and archived_at is null`)) as unknown as Array<any>;
    let rGen = 0;
    for (const it of items) {
      const cadence = it.frequency_days_override ?? rule.default_frequency_days;
      const anchor = it.anchor_date ?? rule.start_date;
      // while_open suppression: an open (non-terminal) task of the item → don't stack the next instance.
      if (rule.duplicate_suppression === 'while_open') {
        const open = (await db.execute(sql`select 1 from tasks where schedule_rule_item_id = ${it.id}::uuid and status not in ('closed','skipped','no_access','cancelled','rescheduled') limit 1`)) as unknown as Array<unknown>;
        if (open.length) { suppressed++; continue; }
      }
      const existing = (await db.execute(sql`select due_date from tasks where schedule_rule_item_id = ${it.id}::uuid and due_date is not null`)) as unknown as Array<{ due_date: string }>;
      const existingDues = new Set(existing.map((e) => e.due_date));
      const lastDue = existing.length ? existing.map((e) => e.due_date).sort().at(-1)! : null;
      const res = computeNextDueDates({ cadenceDays: cadence, anchor, lastDue, through, existingDues });
      if (res.unanchored) { unanchored.push(it.id); continue; }
      skipped += res.skipped;
      if (i.dryRun) { rGen += res.dues.length; generated += res.dues.length; continue; }

      const label = await resolveLabel(deps, it.target_kind, it.location_id, it.asset_id);
      const payload = { ...(rule.default_payload ?? {}), ...(it.payload_override ?? {}) };
      const status = rule.auto_schedule ? 'scheduled' : 'planned';
      for (const due of res.dues) {
        const ins = (await db.execute(sql`
          insert into tasks (kind, status, priority, title, target_kind, location_id, asset_id, target_label, schedule_rule_id, schedule_rule_item_id,
            due_date, scheduled_date, estimated_minutes, payload, created_by)
          values (${rule.kind}, ${status}, ${rule.default_priority}, ${rule.name}, ${it.target_kind}, ${it.location_id}::uuid, ${it.asset_id}::uuid,
            ${label}, ${rule.id}::uuid, ${it.id}::uuid, ${due}, ${due}, ${rule.default_estimated_minutes}, ${JSON.stringify(payload)}::jsonb, ${ctx.membershipId}::uuid)
          on conflict (org_id, schedule_rule_item_id, due_date) where schedule_rule_item_id is not null do nothing returning id`)) as unknown as Array<{ id: string }>;
        if (ins.length) { generated++; rGen++; } else skipped++;
      }
    }
    perRule.push({ ruleId: rule.id, name: rule.name, generated: rGen });
  }
  return { generated, skipped, suppressed, unanchored, throughDate: i.throughDate ?? null, perRule };
}

// ════════════════════════════════════ transition (single status writer) ═════════════════════════
export const transitionInput = z.object({
  taskId: uuid,
  to: catalog.schema('task_status'),
  holdReason: catalog.schema('task_hold_reason').optional(),
  outcomeNote: z.string().optional(),
  expectedStatus: z.string().optional(),
  idempotencyKey: z.string().optional(),
  clientTs: z.union([z.string(), z.date()]).optional(),
});
export type TransitionInput = z.infer<typeof transitionInput>;

export async function transition(db: DbOrTx, ctx: Context, input: TransitionInput) {
  const i = transitionInput.parse(input);
  if (!can(ctx, 'scheduling.tasks.transition')) throw new ForbiddenError('scheduling.tasks.transition');
  const rows = (await db.execute(sql`select id, kind, status, actual_start, hold_started_at, hold_minutes_total, reopen_count from tasks where id = ${i.taskId}::uuid for update`)) as unknown as Array<any>;
  if (!rows.length) throw new FunctionError('TASK_NOT_FOUND');
  const t = rows[0];
  const from = t.status;

  if (i.to === from) return { id: t.id, status: from, alreadyApplied: true }; // idempotent replay
  if (isTaskTerminal(from)) throw new FunctionError('TERMINAL_STATE');
  if (i.expectedStatus && i.expectedStatus !== from) throw new FunctionError('STALE_TRANSITION', `expected ${i.expectedStatus}, head is ${from}`);
  if (!isLegalTransition(from, i.to, t.kind)) throw new FunctionError('INVALID_TRANSITION', `${from} → ${i.to} (${t.kind})`);
  if (i.to === 'on_hold' && !i.holdReason) throw new FunctionError('HOLD_REASON_REQUIRED');
  if ((i.to === 'skipped' || i.to === 'cancelled' || (from === 'completed' && i.to === 'in_progress')) && !i.outcomeNote) throw new FunctionError('OUTCOME_NOTE_REQUIRED');

  const actor = actorOf(ctx);
  const sets: ReturnType<typeof sql>[] = []; // stamps only; the single `status =` is prepended last
  if (i.to === 'in_progress') {
    if (!t.actual_start) sets.push(sql`actual_start = now()`);
    if (from === 'on_hold' && t.hold_started_at) sets.push(sql`hold_minutes_total = hold_minutes_total + floor(extract(epoch from now() - hold_started_at)/60)::int`, sql`hold_reason = null`, sql`hold_started_at = null`);
    if (from === 'completed') sets.push(sql`completed_at = null`, sql`completed_by = null`, sql`reopen_count = reopen_count + 1`, sql`outcome_note = ${i.outcomeNote ?? null}`);
  }
  if (i.to === 'on_hold') sets.push(sql`hold_reason = ${i.holdReason!}`, sql`hold_started_at = now()`);
  if (i.to === 'completed') sets.push(sql`actual_end = now()`, sql`completed_at = now()`, sql`completed_by = ${actor}`);
  if (i.to === 'closed') sets.push(sql`closed_at = now()`, sql`closed_by = ${actor}`);
  if (i.to === 'skipped' || i.to === 'no_access') sets.push(sql`actual_end = now()`, sql`outcome_note = ${i.outcomeNote ?? null}`);
  if (i.to === 'cancelled') sets.push(sql`outcome_note = ${i.outcomeNote ?? null}`);

  // verification gate: if the kind doesn't need a verifier, completed auto-chains to closed.
  let finalStatus = i.to;
  if (i.to === 'completed' && !needsVerification(t.kind)) { sets.push(sql`closed_at = now()`, sql`closed_by = 'app'`); finalStatus = 'closed'; }

  sets.unshift(sql`status = ${finalStatus}`); // exactly one status assignment
  const assignment = sets.reduce((acc, s, idx) => (idx === 0 ? s : sql`${acc}, ${s}`));
  await db.execute(sql`update tasks set ${assignment}, updated_at = now(), updated_by = ${ctx.membershipId}::uuid where id = ${i.taskId}::uuid`);
  return { id: t.id, status: finalStatus, from };
}

// ════════════════════════════════ triggerTaskFromEvent (the loop-closer) ════════════════════════
export const triggerInput = z.object({
  source: z.object({ module: z.string(), eventKind: z.string(), refId: z.string().optional() }),
  dedupeKey: z.string().min(1),
  kind: catalog.schema('task_kind'),
  target: z.object({ kind: catalog.schema('target_kind'), id: uuid }).nullable().optional(),
  targetLabel: z.string().optional(),
  due: z.object({ dueDate: z.string().optional(), dueAt: z.string().optional(), scheduledDate: z.string().optional() }),
  priority: catalog.schema('prioridad').default('normal'),
  title: z.string().min(1),
  description: z.string().optional(),
  payload: z.record(z.unknown()).default({}),
  assign: z.object({ membershipId: uuid.optional(), autoSchedule: z.boolean().optional() }).optional(),
});
export type TriggerInput = z.infer<typeof triggerInput>;

export async function triggerTaskFromEvent(db: DbOrTx, ctx: Context, input: TriggerInput, deps?: SchedDeps) {
  const i = triggerInput.parse(input);
  if (!can(ctx, 'scheduling.tasks.trigger')) throw new ForbiddenError('scheduling.tasks.trigger');
  if (!i.due.dueDate && !i.due.dueAt) throw new FunctionError('DUE_REQUIRED');

  // idempotent on (org_id, dedupe_key): re-firing the same event returns the existing task.
  const dup = (await db.execute(sql`select id, status from tasks where dedupe_key = ${i.dedupeKey} limit 1`)) as unknown as Array<{ id: string; status: string }>;
  if (dup.length) return { task: dup[0], created: false };

  let label = i.targetLabel ?? null;
  if (!label && i.target) label = await resolveLabel(deps, i.target.kind, i.target.kind === 'location' ? i.target.id : null, i.target.kind === 'asset' ? i.target.id : null);
  const autoSchedule = !!i.assign?.autoSchedule;
  const status = autoSchedule ? 'scheduled' : 'planned';
  const rows = (await db.execute(sql`
    insert into tasks (kind, status, priority, title, description, target_kind, location_id, asset_id, target_label,
      source_module, source_event_kind, source_ref_id, dedupe_key, due_date, due_at, scheduled_date, payload, created_by)
    values (${i.kind}, ${status}, ${i.priority}, ${i.title}, ${i.description ?? null}, ${i.target?.kind ?? null},
      ${i.target?.kind === 'location' ? i.target.id : null}::uuid, ${i.target?.kind === 'asset' ? i.target.id : null}::uuid, ${label},
      ${i.source.module}, ${i.source.eventKind}, ${i.source.refId ?? null}::uuid, ${i.dedupeKey}, ${i.due.dueDate ?? null},
      ${i.due.dueAt ?? null}, ${i.due.scheduledDate ?? i.due.dueDate ?? null}, ${JSON.stringify(i.payload)}::jsonb, ${ctx.membershipId}::uuid)
    returning id, status, kind, title, due_date
  `)) as unknown as Array<Record<string, unknown>>;
  const task = rows[0];
  if (i.assign?.membershipId) {
    await db.execute(sql`insert into task_assignments (task_id, membership_id, role, assigned_by, created_by) values (${task.id as string}::uuid, ${i.assign.membershipId}::uuid, 'lead', ${actorOf(ctx)}, ${ctx.membershipId}::uuid)`);
  }
  return { task, created: true };
}

// ════════════════════════════════════════ board / reads ═════════════════════════════════════════
export async function dailyBoard(db: DbOrTx, ctx: Context, input?: { date?: string; kind?: string; membershipId?: string }) {
  if (!can(ctx, 'scheduling.tasks.read')) throw new ForbiddenError('scheduling.tasks.read');
  const date = input?.date ?? today();
  const mine = input?.membershipId ? uuid.parse(input.membershipId) : null;
  const where = sql`
    where t.scheduled_date = ${date}
      ${input?.kind ? sql`and t.kind = ${input.kind}` : sql``}
      ${mine ? sql`and exists (select 1 from task_assignments a where a.task_id = t.id and a.membership_id = ${mine}::uuid and a.released_at is null)` : sql``}
  `;
  const counts = (await db.execute(sql`
    select count(*)::int as total,
      count(*) filter (where status in ('planned','scheduled'))::int as pendientes,
      count(*) filter (where status = 'in_progress')::int as en_curso,
      count(*) filter (where status = 'on_hold')::int as en_espera,
      count(*) filter (where status in ('completed','closed'))::int as terminadas,
      count(*) filter (where status not in ('closed','skipped','no_access','cancelled','rescheduled') and (due_date < ${date} or (due_at is not null and due_at < now())))::int as overdue
    from tasks t ${where}`)) as unknown as Array<Record<string, number>>;
  const rows = (await db.execute(sql`
    select t.id, t.kind, t.status, t.priority, t.title, t.target_label, t.scheduled_window_start, t.due_at, t.hold_reason,
      coalesce((select json_agg(json_build_object('membershipId', a.membership_id, 'role', a.role)) from task_assignments a where a.task_id = t.id and a.released_at is null), '[]'::json) as assignments
    from tasks t ${where}
    order by case t.priority when 'critico' then 0 when 'urgente' then 1 when 'normal' then 2 else 3 end, t.scheduled_window_start nulls last`)) as unknown as Array<Record<string, unknown>>;
  return { date, counts: counts[0], tasks: rows };
}

export const listTasksInput = z.object({
  status: z.array(z.string()).optional(), kind: z.array(z.string()).optional(),
  scheduleRuleId: uuid.optional(), sourceModule: z.string().optional(), sourceRefId: uuid.optional(),
  targetKind: z.string().optional(), targetId: uuid.optional(),
  page: z.number().int().min(1).default(1), pageSize: z.number().int().min(1).max(100).default(30),
});
export async function listTasks(db: DbOrTx, ctx: Context, input?: z.infer<typeof listTasksInput>) {
  if (!can(ctx, 'scheduling.tasks.read')) throw new ForbiddenError('scheduling.tasks.read');
  const f = listTasksInput.parse(input ?? {});
  const where = sql`
    where ${f.status?.length ? sql`status = any(${sql.raw(`array[${f.status.map((s) => `'${s.replace(/'/g, '')}'`).join(',')}]`)})` : sql`true`}
      ${f.kind?.length ? sql`and kind = any(${sql.raw(`array[${f.kind.map((s) => `'${s.replace(/'/g, '')}'`).join(',')}]`)})` : sql``}
      ${f.scheduleRuleId ? sql`and schedule_rule_id = ${f.scheduleRuleId}::uuid` : sql``}
      ${f.sourceModule ? sql`and source_module = ${f.sourceModule}` : sql``}
      ${f.sourceRefId ? sql`and source_ref_id = ${f.sourceRefId}::uuid` : sql``}
      ${f.targetKind === 'asset' && f.targetId ? sql`and asset_id = ${f.targetId}::uuid` : sql``}
      ${f.targetKind === 'location' && f.targetId ? sql`and location_id = ${f.targetId}::uuid` : sql``}
  `;
  const totalRows = (await db.execute(sql`select count(*)::int c from tasks ${where}`)) as unknown as Array<{ c: number }>;
  const rows = (await db.execute(sql`
    select id, kind, status, priority, title, target_label, due_date, scheduled_date, created_at
    from tasks ${where} order by scheduled_date desc nulls last, created_at desc limit ${f.pageSize} offset ${(f.page - 1) * f.pageSize}
  `)) as unknown as Array<Record<string, unknown>>;
  return { rows, total: totalRows[0]?.c ?? 0, page: f.page, pageSize: f.pageSize };
}

export async function getTask(db: DbOrTx, ctx: Context, input: { taskId: string }) {
  if (!can(ctx, 'scheduling.tasks.read')) throw new ForbiddenError('scheduling.tasks.read');
  const id = uuid.parse(input.taskId);
  const rows = (await db.execute(sql`select * from tasks where id = ${id}::uuid`)) as unknown as Array<any>;
  if (!rows.length) throw new FunctionError('TASK_NOT_FOUND');
  const assignments = (await db.execute(sql`select id, membership_id, role, claimed_at from task_assignments where task_id = ${id}::uuid and released_at is null`)) as unknown as Array<Record<string, unknown>>;
  return { ...rows[0], assignments, legalNext: legalNext(rows[0].status, rows[0].kind) };
}

// ════════════════════════════════════════ assignment ═══════════════════════════════════════════
export async function confirmSchedule(db: DbOrTx, ctx: Context, input: { taskIds: string[]; scheduledDate?: string }) {
  if (!can(ctx, 'scheduling.tasks.dispatch')) throw new ForbiddenError('scheduling.tasks.dispatch');
  const confirmed: string[] = [];
  const failed: { id: string; reason: string }[] = [];
  for (const tid of input.taskIds) {
    try {
      const t = (await db.execute(sql`select status, kind from tasks where id = ${tid}::uuid for update`)) as unknown as Array<{ status: string; kind: string }>;
      if (!t.length) { failed.push({ id: tid, reason: 'TASK_NOT_FOUND' }); continue; }
      if (!isLegalTransition(t[0].status, 'scheduled', t[0].kind)) { failed.push({ id: tid, reason: `cannot schedule from ${t[0].status}` }); continue; }
      await db.execute(sql`update tasks set status = 'scheduled', ${input.scheduledDate ? sql`scheduled_date = ${input.scheduledDate},` : sql``} updated_at = now(), updated_by = ${ctx.membershipId}::uuid where id = ${tid}::uuid`);
      confirmed.push(tid);
    } catch (e) { failed.push({ id: tid, reason: (e as Error).message }); }
  }
  return { confirmed, failed };
}

export async function assignTask(db: DbOrTx, ctx: Context, input: { taskId: string; members: { membershipId: string; role?: string }[]; releaseOthers?: boolean }) {
  if (!can(ctx, 'scheduling.tasks.assign')) throw new ForbiddenError('scheduling.tasks.assign');
  const taskId = uuid.parse(input.taskId);
  const t = (await db.execute(sql`select id from tasks where id = ${taskId}::uuid`)) as unknown as Array<{ id: string }>;
  if (!t.length) throw new FunctionError('TASK_NOT_FOUND');
  if (input.members.filter((m) => m.role === 'lead').length > 1) throw new FunctionError('LEAD_CONFLICT');
  if (input.releaseOthers) await db.execute(sql`update task_assignments set released_at = now() where task_id = ${taskId}::uuid and released_at is null`);
  const actor = actorOf(ctx);
  for (const m of input.members) {
    await db.execute(sql`
      insert into task_assignments (task_id, membership_id, role, assigned_by, created_by)
      values (${taskId}::uuid, ${m.membershipId}::uuid, ${m.role ?? 'apoyo'}, ${actor}, ${ctx.membershipId}::uuid)
      on conflict do nothing`);
  }
  const rows = (await db.execute(sql`select id, membership_id, role from task_assignments where task_id = ${taskId}::uuid and released_at is null`)) as unknown as Array<Record<string, unknown>>;
  return rows;
}

export async function claimTask(db: DbOrTx, ctx: Context, input: { taskId: string }) {
  if (!can(ctx, 'scheduling.tasks.claim')) throw new ForbiddenError('scheduling.tasks.claim');
  if (!ctx.membershipId) throw new FunctionError('NO_MEMBERSHIP');
  const taskId = uuid.parse(input.taskId);
  try {
    const rows = (await db.execute(sql`
      insert into task_assignments (task_id, membership_id, role, claimed_at, created_by)
      values (${taskId}::uuid, ${ctx.membershipId}::uuid, 'lead', now(), ${ctx.membershipId}::uuid)
      returning id`)) as unknown as Array<{ id: string }>;
    return { assignmentId: rows[0].id, claimed: true };
  } catch (e) {
    // the partial-unique "one live lead per task" index rejected it — someone else won.
    throw new FunctionError('ALREADY_CLAIMED');
  }
}
