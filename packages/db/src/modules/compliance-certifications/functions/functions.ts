// compliance-certifications Functions (spec §4) — pure (db, ctx, input) functions; `db` arrives
// already tenant-scoped (the installed-app runtime owns the RLS/GUC chokepoint; capabilities never
// call withTenant). The single vencimientos engine: the credential vault (upsert with renewal-
// supersede), the obligation catalog, the append-only event chronology, the 30/15/7 expiry sweep, the
// "¿estamos al día?" traffic-light board, and bitácora exports (folio + snapshot).
//
// G24 ANTI-CYCLE: compliance is HIGHER-LEVEL than equipment/scheduling (it calls INTO them; they only
// reference us by CredentialRecord). So copafix's HARD imports of scheduling-field-service.{
// triggerTaskFromEvent,listTasks} + equipment-maintenance.createMaintenanceOrder become INJECTED DEPS
// (a ComplianceDeps resolver, wired by the app at the router). Absent → the sweep degrades to
// credential-expiry + recompute only (documented degradation, never a block). The task-spawning halves
// wire when scheduling-field-service + platform-core land.
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import type { Context, DbOrTx } from '@astralitics/module-identity-access';
import { can, FunctionError, ForbiddenError } from '@astralitics/module-identity-access';
import { catalog } from '@astralitics/definitions';
import { isLegalObligation, isLegalCredential, alertStageFor, stageAdvanced, computeLight, type Light } from './transitions.js';

const uuid = z.string().uuid();
const todayIso = () => new Date().toISOString().slice(0, 10);

// ── INJECTED DEPS (G24 anti-cycle) ───────────────────────────────────────────────────────────────
// The app wires these at the router so this module never hard-imports scheduling/equipment (which
// would cycle). Each is optional; when absent the sweep degrades gracefully (credential-expiry only).
export interface ComplianceDeps {
  /** equipment-maintenance.createMaintenanceOrder — a due `direct` obligation with spawn_task_kind='ot'. */
  createMaintenanceOrder?: (
    db: DbOrTx,
    ctx: Context,
    input: Record<string, unknown>,
  ) => Promise<{ taskId: string; taskCreated: boolean }>;
  /** scheduling-field-service.triggerTaskFromEvent — a bare scheduling Task for non-'ot' direct work. */
  triggerTaskFromEvent?: (
    db: DbOrTx,
    ctx: Context,
    input: Record<string, unknown>,
  ) => Promise<{ task: { id: string } & Record<string, unknown>; created: boolean }>;
  /** scheduling-field-service.listTasks — closed obligation Tasks → cumplimiento events (loop-closer). */
  listTasks?: (
    db: DbOrTx,
    ctx: Context,
    input: Record<string, unknown>,
  ) => Promise<{ rows: Array<{ id: string } & Record<string, unknown>>; total: number; page: number; pageSize: number }>;
}

// ════════════════════════════════════════════ CREDENTIALS ═══════════════════════════════════════
export const credentialInput = z.object({
  holderKind: catalog.schema('credential_holder_kind'),
  holderId: uuid.optional(),
  holderLabel: z.string().min(1),
  kind: catalog.schema('credential_kind'),
  title: z.string().optional(),
  number: z.string().optional(),
  issuingAuthority: z.string().optional(),
  issuedAt: z.string().optional(),
  expiresAt: z.string().optional(),
  documentId: uuid.optional(),
  obligationId: uuid.optional(),
  notes: z.string().optional(),
});
export type CredentialInput = z.infer<typeof credentialInput>;

export async function upsertCredentialRecord(db: DbOrTx, ctx: Context, input: CredentialInput) {
  const i = credentialInput.parse(input);
  if (!can(ctx, 'compliance.credentials.write')) throw new ForbiddenError('compliance.credentials.write');
  if (i.holderKind !== 'org' && !i.holderId) throw new FunctionError('INVALID_HOLDER', 'holder_id required unless holder_kind=org');
  if (i.issuedAt && i.expiresAt && i.expiresAt < i.issuedAt) throw new FunctionError('EXPIRES_BEFORE_ISSUED');

  // idempotent on (holder_kind, holder_id, kind, number): same folio → return existing.
  if (i.number) {
    const same = (await db.execute(sql`
      select id from credential_records where holder_kind = ${i.holderKind} and holder_id is not distinct from ${i.holderId ?? null}::uuid
        and kind = ${i.kind} and number = ${i.number} limit 1
    `)) as unknown as Array<{ id: string }>;
    if (same.length) return { credential: { id: same[0].id }, superseded: null, replayed: true };
  }

  // renewal: supersede an existing active of the same (holder, kind) with an earlier expiry.
  let superseded: { id: string } | null = null;
  const actives = (await db.execute(sql`
    select id, expires_at from credential_records
    where holder_kind = ${i.holderKind} and holder_id is not distinct from ${i.holderId ?? null}::uuid and kind = ${i.kind} and status = 'active'
    for update
  `)) as unknown as Array<{ id: string; expires_at: string | null }>;
  const prior = actives.find((a) => !i.expiresAt || !a.expires_at || a.expires_at <= i.expiresAt);

  const ins = (await db.execute(sql`
    insert into credential_records (org_id, holder_kind, holder_id, holder_label, kind, title, number, issuing_authority, issued_at, expires_at, document_id, obligation_id, notes, created_by)
    values (${ctx.orgId}::uuid, ${i.holderKind}, ${i.holderId ?? null}::uuid, ${i.holderLabel}, ${i.kind}, ${i.title ?? null}, ${i.number ?? null}, ${i.issuingAuthority ?? null},
            ${i.issuedAt ?? null}, ${i.expiresAt ?? null}, ${i.documentId ?? null}::uuid, ${i.obligationId ?? null}::uuid, ${i.notes ?? null}, ${ctx.membershipId}::uuid)
    returning id, kind, holder_label, expires_at, status
  `)) as unknown as Array<Record<string, unknown>>;
  const credential = ins[0];

  if (prior) {
    await db.execute(sql`update credential_records set status = 'superseded', replaced_by_id = ${credential.id as string}::uuid, updated_at = now() where id = ${prior.id}::uuid`);
    superseded = { id: prior.id };
    await db.execute(sql`
      insert into compliance_events (org_id, obligation_id, credential_id, kind, occurred_at, source_module, created_by)
      values (${ctx.orgId}::uuid, ${i.obligationId ?? null}::uuid, ${credential.id as string}::uuid, 'renovacion', now(), 'compliance-certifications', ${ctx.membershipId}::uuid)
    `);
  }
  return { credential, superseded };
}

export const listCredentialsInput = z.object({
  holderKind: z.string().optional(), holderId: uuid.optional(), kind: z.string().optional(),
  status: z.string().optional(), expiringWithinDays: z.number().int().optional(), obligationId: uuid.optional(),
  page: z.number().int().min(1).default(1), pageSize: z.number().int().min(1).max(200).default(50),
});
export async function listCredentials(db: DbOrTx, ctx: Context, input?: z.infer<typeof listCredentialsInput>) {
  if (!can(ctx, 'compliance.credentials.read')) throw new ForbiddenError('compliance.credentials.read');
  const f = listCredentialsInput.parse(input ?? {});
  const horizon = f.expiringWithinDays != null ? new Date(Date.now() + f.expiringWithinDays * 86400000).toISOString().slice(0, 10) : null;
  const where = sql`
    where ${f.holderKind ? sql`holder_kind = ${f.holderKind}` : sql`true`}
      ${f.holderId ? sql`and holder_id = ${f.holderId}::uuid` : sql``}
      ${f.kind ? sql`and kind = ${f.kind}` : sql``}
      ${f.status ? sql`and status = ${f.status}` : sql``}
      ${f.obligationId ? sql`and obligation_id = ${f.obligationId}::uuid` : sql``}
      ${horizon ? sql`and expires_at is not null and expires_at <= ${horizon}` : sql``}
  `;
  const totalRows = (await db.execute(sql`select count(*)::int c from credential_records ${where}`)) as unknown as Array<{ c: number }>;
  const rows = (await db.execute(sql`
    select id, holder_kind, holder_id, holder_label, kind, title, number, issuing_authority, issued_at, expires_at, status, alert_stage
    from credential_records ${where} order by expires_at asc nulls last limit ${f.pageSize} offset ${(f.page - 1) * f.pageSize}
  `)) as unknown as Array<Record<string, unknown>>;
  return { rows, total: totalRows[0]?.c ?? 0, page: f.page, pageSize: f.pageSize };
}

export async function getCredential(db: DbOrTx, ctx: Context, input: { id: string }) {
  if (!can(ctx, 'compliance.credentials.read')) throw new ForbiddenError('compliance.credentials.read');
  const id = uuid.parse(input.id);
  const rows = (await db.execute(sql`select * from credential_records where id = ${id}::uuid`)) as unknown as Array<Record<string, unknown>>;
  if (!rows.length) throw new FunctionError('CREDENTIAL_NOT_FOUND');
  return rows[0];
}

export async function vencimientosBoard(db: DbOrTx, ctx: Context, input?: { holderKind?: string }) {
  if (!can(ctx, 'compliance.credentials.read')) throw new ForbiddenError('compliance.credentials.read');
  const hk = input?.holderKind ?? null;
  const rows = (await db.execute(sql`
    -- holder_id entra no painel para a linha poder AGIR: sem ele, "vence em 7 dias" é um aviso
    -- que não leva a lugar nenhum — quem renova a calibração precisa saber de que instrumento.
    select id, holder_kind, holder_id, holder_label, kind, title, number, expires_at, status,
      case
        when expires_at is null then 'later'
        when expires_at < ${todayIso()} then 'expired'
        when expires_at <= ${new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)} then 'd7'
        when expires_at <= ${new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10)} then 'd15'
        when expires_at <= ${new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)} then 'd30'
        else 'later' end as bucket
    from credential_records
    where status in ('active','expired') ${hk ? sql`and holder_kind = ${hk}` : sql``}
    order by expires_at asc nulls last
  `)) as unknown as Array<Record<string, unknown> & { bucket: string }>;
  const buckets: Record<string, any[]> = { expired: [], d7: [], d15: [], d30: [], later: [] };
  for (const r of rows) (buckets[r.bucket] ?? buckets.later).push(r);
  return { buckets, counts: { expired: buckets.expired.length, d7: buckets.d7.length, d15: buckets.d15.length, d30: buckets.d30.length, later: buckets.later.length } };
}

// ════════════════════════════════════════════ OBLIGATIONS ═══════════════════════════════════════
export const obligationInput = z.object({
  id: uuid.optional(),
  name: z.string().min(1),
  normRef: z.string().optional(),
  authority: z.string().optional(),
  domain: catalog.schema('compliance_domain').default('interno'),
  description: z.string().optional(),
  riskNote: z.string().optional(),
  fulfillmentMode: catalog.schema('obligation_fulfillment_mode'),
  frequencyDays: z.number().int().nullable().optional(),
  graceDays: z.number().int().optional(),
  requiredCredentialKind: catalog.schema('credential_kind').optional(),
  scope: z.array(z.object({ kind: z.enum(['asset', 'location', 'org']), id: z.string().optional(), label: z.string().optional() })).optional(),
  evidenceRequirements: z.array(catalog.schema('evidence_kind')).default([]),
  responsibleKind: catalog.schema('obligation_responsible').default('interno'),
  vendorId: uuid.optional(),
  spawnTaskKind: catalog.schema('task_kind').optional(),
  spawnLeadDays: z.number().int().optional(),
  retentionYears: z.number().int().optional(),
  anchorDate: z.string().optional(),
});
export async function upsertObligation(db: DbOrTx, ctx: Context, input: z.infer<typeof obligationInput>) {
  const i = obligationInput.parse(input);
  if (!can(ctx, 'compliance.obligations.manage')) throw new ForbiddenError('compliance.obligations.manage');
  if (i.id) {
    await db.execute(sql`
      update compliance_obligations set name=${i.name}, norm_ref=${i.normRef ?? null}, authority=${i.authority ?? null}, domain=${i.domain},
        description=${i.description ?? null}, risk_note=${i.riskNote ?? null}, fulfillment_mode=${i.fulfillmentMode},
        frequency_days=${i.frequencyDays ?? null}, required_credential_kind=${i.requiredCredentialKind ?? null},
        scope=${i.scope ? JSON.stringify(i.scope) : null}::jsonb, evidence_requirements=${JSON.stringify(i.evidenceRequirements)}::jsonb,
        responsible_kind=${i.responsibleKind}, vendor_id=${i.vendorId ?? null}::uuid, spawn_task_kind=${i.spawnTaskKind ?? null},
        retention_years=${i.retentionYears ?? null}, anchor_date=${i.anchorDate ?? null}, updated_at=now(), updated_by=${ctx.membershipId}::uuid
      where id=${i.id}::uuid`);
    return { id: i.id, updated: true };
  }
  const rows = (await db.execute(sql`
    insert into compliance_obligations (org_id, name, norm_ref, authority, domain, description, risk_note, fulfillment_mode, frequency_days,
      grace_days, required_credential_kind, scope, evidence_requirements, responsible_kind, vendor_id, spawn_task_kind, spawn_lead_days, retention_years, anchor_date, next_due_date, created_by)
    values (${ctx.orgId}::uuid, ${i.name}, ${i.normRef ?? null}, ${i.authority ?? null}, ${i.domain}, ${i.description ?? null}, ${i.riskNote ?? null}, ${i.fulfillmentMode},
      ${i.frequencyDays ?? null}, ${i.graceDays ?? 5}, ${i.requiredCredentialKind ?? null}, ${i.scope ? JSON.stringify(i.scope) : null}::jsonb,
      ${JSON.stringify(i.evidenceRequirements)}::jsonb, ${i.responsibleKind}, ${i.vendorId ?? null}::uuid, ${i.spawnTaskKind ?? null},
      ${i.spawnLeadDays ?? 14}, ${i.retentionYears ?? null}, ${i.anchorDate ?? null}, ${i.anchorDate ?? null}, ${ctx.membershipId}::uuid)
    returning id, name, status, domain, fulfillment_mode
  `)) as unknown as Array<Record<string, unknown>>;
  return rows[0];
}

export async function transitionObligation(db: DbOrTx, ctx: Context, input: { id: string; to: string; note?: string }) {
  const id = uuid.parse(input.id);
  const to = catalog.schema('obligation_status').parse(input.to);
  if (!can(ctx, 'compliance.obligations.manage')) throw new ForbiddenError('compliance.obligations.manage');
  const rows = (await db.execute(sql`select id, status, fulfillment_mode, schedule_rule_id, required_credential_kind, spawn_task_kind, scope, vendor_id, frequency_days from compliance_obligations where id = ${id}::uuid`)) as unknown as Array<any>;
  if (!rows.length) throw new FunctionError('OBLIGATION_NOT_FOUND');
  const o = rows[0];
  if (o.status === to) return { id, status: to, changed: false };
  if (!isLegalObligation(o.status, to)) throw new FunctionError('INVALID_TRANSITION', `${o.status} → ${to}`);
  if ((to === 'suspended' || to === 'retired') && !input.note) throw new FunctionError('NOTE_REQUIRED');
  if (to === 'active') {
    // mode-coherence guards (§2.1)
    if (o.fulfillment_mode === 'document_only' && !o.required_credential_kind) throw new FunctionError('GUARD_FAILED', 'document_only needs required_credential_kind');
    if (o.fulfillment_mode === 'direct' && (!o.spawn_task_kind || !(o.scope || o.vendor_id))) throw new FunctionError('GUARD_FAILED', 'direct needs spawn_task_kind + scope/vendor');
    if (o.fulfillment_mode !== 'document_only' && o.frequency_days == null) throw new FunctionError('GUARD_FAILED', 'frequency_days required');
  }
  await db.execute(sql`update compliance_obligations set status = ${to}, updated_at = now(), updated_by = ${ctx.membershipId}::uuid where id = ${id}::uuid`);
  return { id, status: to, changed: true };
}

export const listObligationsInput = z.object({ domain: z.string().optional(), status: z.string().optional() });
export async function listObligations(db: DbOrTx, ctx: Context, input?: z.infer<typeof listObligationsInput>) {
  if (!can(ctx, 'compliance.board.read')) throw new ForbiddenError('compliance.board.read');
  const f = listObligationsInput.parse(input ?? {});
  const rows = (await db.execute(sql`
    select id, name, norm_ref, authority, domain, fulfillment_mode, frequency_days, responsible_kind, next_due_date, status, risk_note
    from compliance_obligations
    where ${f.domain ? sql`domain = ${f.domain}` : sql`true`} ${f.status ? sql`and status = ${f.status}` : sql``}
    order by domain, name
  `)) as unknown as Array<Record<string, unknown>>;
  return rows;
}

export async function getObligationDetail(db: DbOrTx, ctx: Context, input: { id: string }) {
  if (!can(ctx, 'compliance.board.read')) throw new ForbiddenError('compliance.board.read');
  const id = uuid.parse(input.id);
  const o = (await db.execute(sql`select * from compliance_obligations where id = ${id}::uuid`)) as unknown as Array<Record<string, unknown>>;
  if (!o.length) throw new FunctionError('OBLIGATION_NOT_FOUND');
  const events = (await db.execute(sql`select id, kind, result, occurred_at, period_key, note, evidence from compliance_events where obligation_id = ${id}::uuid order by occurred_at desc limit 25`)) as unknown as Array<Record<string, unknown>>;
  const credentials = (await db.execute(sql`select id, kind, holder_label, expires_at, status from credential_records where obligation_id = ${id}::uuid order by expires_at asc nulls last`)) as unknown as Array<Record<string, unknown>>;
  return { obligation: o[0], recentEvents: events, credentials, openTasks: [] }; // openTasks wire with scheduling
}

// ════════════════════════════════════════════ EVENTS ════════════════════════════════════════════
export const eventInput = z.object({
  obligationId: uuid.optional(),
  credentialId: uuid.optional(),
  kind: catalog.schema('compliance_event_kind'),
  result: catalog.schema('compliance_event_result').optional(),
  occurredAt: z.union([z.string(), z.date()]).optional(),
  periodKey: z.string().optional(),
  evidence: z.array(z.object({ documentId: z.string().optional(), label: z.string().optional(), evidenceKind: z.string() })).default([]),
  correctsEventId: uuid.optional(),
  note: z.string().optional(),
});
export async function recordComplianceEvent(db: DbOrTx, ctx: Context, input: z.infer<typeof eventInput>) {
  const i = eventInput.parse(input);
  if (!can(ctx, 'compliance.events.record')) throw new ForbiddenError('compliance.events.record');
  if (i.kind === 'cumplimiento' && !i.result) throw new FunctionError('RESULT_REQUIRED');
  if (i.kind === 'anulacion' && (!i.correctsEventId || !i.note)) throw new FunctionError('CORRECTS_REQUIRED');
  if ((i.kind === 'hallazgo') && !i.note) throw new FunctionError('NOTE_REQUIRED');
  if (i.obligationId) {
    const o = (await db.execute(sql`select id from compliance_obligations where id = ${i.obligationId}::uuid`)) as unknown as Array<{ id: string }>;
    if (!o.length) throw new FunctionError('OBLIGATION_NOT_FOUND');
  }
  const occurredAt = i.occurredAt ? new Date(i.occurredAt).toISOString() : new Date().toISOString();
  const rows = (await db.execute(sql`
    insert into compliance_events (org_id, obligation_id, credential_id, kind, result, occurred_at, period_key, source_module, evidence, corrects_event_id, note, created_by)
    values (${ctx.orgId}::uuid, ${i.obligationId ?? null}::uuid, ${i.credentialId ?? null}::uuid, ${i.kind}, ${i.result ?? null}, ${occurredAt}, ${i.periodKey ?? null}, null,
            ${JSON.stringify(i.evidence)}::jsonb, ${i.correctsEventId ?? null}::uuid, ${i.note ?? null}, ${ctx.membershipId}::uuid)
    returning id, kind, result, occurred_at
  `)) as unknown as Array<Record<string, unknown>>;
  // recompute next_due_date from the latest cumplimiento + frequency_days
  if (i.obligationId && i.kind === 'cumplimiento') await recomputeNextDue(db, i.obligationId);
  return rows[0];
}

export async function recomputeNextDue(db: DbOrTx, obligationId: string) {
  const o = (await db.execute(sql`select frequency_days, anchor_date from compliance_obligations where id = ${obligationId}::uuid`)) as unknown as Array<{ frequency_days: number | null; anchor_date: string | null }>;
  if (!o.length || o[0].frequency_days == null) return;
  const last = (await db.execute(sql`select occurred_at from compliance_events where obligation_id = ${obligationId}::uuid and kind = 'cumplimiento' order by occurred_at desc limit 1`)) as unknown as Array<{ occurred_at: string }>;
  const base = last.length ? new Date(last[0].occurred_at) : (o[0].anchor_date ? new Date(o[0].anchor_date + 'T00:00:00Z') : null);
  if (!base) return;
  const next = new Date(base.getTime() + o[0].frequency_days * 86400000).toISOString().slice(0, 10);
  await db.execute(sql`update compliance_obligations set next_due_date = ${next}, updated_at = now() where id = ${obligationId}::uuid`);
}

// ════════════════════════════════════════ TRAFFIC LIGHT BOARD ═══════════════════════════════════
export async function trafficLightBoard(db: DbOrTx, ctx: Context, input?: { domain?: string }) {
  if (!can(ctx, 'compliance.board.read')) throw new ForbiddenError('compliance.board.read');
  const asOf = new Date();
  const obls = (await db.execute(sql`
    select o.id, o.name, o.norm_ref, o.domain, o.status, o.next_due_date, o.responsible_kind, o.required_credential_kind, o.fulfillment_mode, o.risk_note,
      (select result from compliance_events e where e.obligation_id = o.id and e.kind = 'cumplimiento' order by e.occurred_at desc limit 1) as last_result,
      (select occurred_at from compliance_events e where e.obligation_id = o.id order by e.occurred_at desc limit 1) as last_event_at,
      (select count(*)::int from compliance_events e where e.obligation_id = o.id) as event_count
    from compliance_obligations o
    where ${input?.domain ? sql`o.domain = ${input.domain}` : sql`true`}
    order by o.domain, o.name
  `)) as unknown as Array<any>;

  const rows = await Promise.all(obls.map(async (o) => {
    let requiredCredentialStatus: string | null | undefined;
    // For document_only, the required credential's own expiry IS the due signal (no cadence).
    let effectiveDue: string | null = o.next_due_date;
    let hasBaseline = Number(o.event_count) > 0;
    if (o.fulfillment_mode === 'document_only' && o.required_credential_kind) {
      const c = (await db.execute(sql`select status, expires_at from credential_records where obligation_id = ${o.id}::uuid and kind = ${o.required_credential_kind} and status in ('active','expired') order by expires_at desc nulls last limit 1`)) as unknown as Array<{ status: string; expires_at: string | null }>;
      requiredCredentialStatus = c.length ? c[0].status : null;
      if (c.length && c[0].status === 'active') { effectiveDue = c[0].expires_at; hasBaseline = true; }
    }
    const light: Light = computeLight({
      status: o.status, nextDueDate: effectiveDue, lastResult: o.last_result,
      hasBaseline, requiredCredentialStatus, asOf,
    });
    const daysLeft = effectiveDue ? Math.floor((new Date(effectiveDue + 'T00:00:00Z').getTime() - Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), asOf.getUTCDate())) / 86400000) : null;
    return { obligationId: o.id, name: o.name, normRef: o.norm_ref, domain: o.domain, light, nextDueDate: o.next_due_date, daysLeft, lastEventAt: o.last_event_at, lastResult: o.last_result, responsible: o.responsible_kind, riskNote: o.risk_note };
  }));
  const summary = { verde: 0, amarillo: 0, rojo: 0, gris: 0 } as Record<Light, number>;
  for (const r of rows) summary[r.light]++;
  return { summary, rows };
}

// ════════════════════════════════════════════ SWEEP ═════════════════════════════════════════════
export async function expirySweep(db: DbOrTx, ctx: Context, input?: { asOf?: string; dryRun?: boolean }, deps?: ComplianceDeps) {
  if (!can(ctx, 'compliance.sweep.run')) throw new ForbiddenError('compliance.sweep.run');
  const asOf = input?.asOf ? new Date(input.asOf) : new Date();
  const asOfIso = asOf.toISOString().slice(0, 10);
  const dryRun = !!input?.dryRun;
  const issues: string[] = [];
  let staged = 0, expired = 0, recomputed = 0;

  // 1. credentials: stage advances + auto-expire
  const creds = (await db.execute(sql`select id, expires_at, alert_stage, status from credential_records where status = 'active' and expires_at is not null and expires_at <= ${new Date(asOf.getTime() + 30 * 86400000).toISOString().slice(0, 10)}`)) as unknown as Array<{ id: string; expires_at: string; alert_stage: string | null; status: string }>;
  for (const c of creds) {
    const stage = alertStageFor(c.expires_at, asOf);
    if (stage && stageAdvanced(c.alert_stage, stage)) {
      staged++;
      if (!dryRun) await db.execute(sql`update credential_records set alert_stage = ${stage}, updated_at = now() where id = ${c.id}::uuid`);
      // dispatch_notification wires with platform-core; until then the stage stamp is the signal.
    }
    if (c.expires_at < asOfIso) {
      expired++;
      if (!dryRun && isLegalCredential('active', 'expired')) await db.execute(sql`update credential_records set status = 'expired', alert_stage = 'expired', updated_at = now() where id = ${c.id}::uuid`);
    }
  }
  // 2+3. obligations: spawn due `direct` work, materialize cumplimiento events from closed Tasks
  // (both modes), and advance next_due. This is the compliance loop-closer (design §4.1 expirySweep).
  // Degrades to credential-expiry + recompute only when the injected deps are absent (scheduling/
  // equipment not yet installed) — never blocks.
  let tasksSpawned = 0, eventsMaterialized = 0;
  const obls = (await db.execute(sql`
    select id, fulfillment_mode, schedule_rule_id, next_due_date, spawn_lead_days, spawn_task_kind, scope, vendor_id, name, norm_ref, frequency_days
    from compliance_obligations where status = 'active'
  `)) as unknown as Array<any>;
  for (const o of obls) {
    if (dryRun) continue;
    // spawn the next direct task if we're within its lead window (idempotent by dedupe per period).
    if (o.fulfillment_mode === 'direct' && o.next_due_date && (deps?.createMaintenanceOrder || deps?.triggerTaskFromEvent)) {
      const spawnAtMs = new Date(o.next_due_date + 'T00:00:00Z').getTime() - (o.spawn_lead_days ?? 14) * 86400000;
      if (spawnAtMs <= asOf.getTime()) {
        const r = await spawnObligationTask(db, ctx, o, o.next_due_date as string, deps);
        if (r?.created) tasksSpawned++;
      }
    }
    // materialize cumplimiento events from any newly-closed Tasks (syncEventsFromTasks advances
    // next_due when it records one — so the clock only moves on real completion, not every sweep).
    if (deps?.listTasks) {
      const synced = await syncEventsFromTasks(db, ctx, { obligationId: o.id }, deps);
      eventsMaterialized += synced.materialized;
      if (synced.materialized > 0) recomputed++;
    }
  }

  return { asOf: asOfIso, dryRun, credentialsStaged: staged, credentialsExpired: expired, obligationsRecomputed: recomputed, tasksSpawned, eventsMaterialized, issues };
}

// ── spawnObligationTask (internal) — a due `direct` obligation generates work via THE loop-closers ─
// spawn_task_kind='ot' with a physical target → equipment.createMaintenanceOrder (Task + satellite);
// otherwise a bare scheduling Task via triggerTaskFromEvent. Dedupe 'obligation:<id>:<due>' makes it
// idempotent per period (re-firing the sweep returns the existing Task). Cross-module calls are the
// injected deps (G24 anti-cycle): degrades to no-op when the resolver is absent.
export async function spawnObligationTask(db: DbOrTx, ctx: Context, o: any, dueDate: string, deps?: ComplianceDeps): Promise<{ taskId: string; created: boolean } | null> {
  const dedupeKey = `obligation:${o.id}:${dueDate}`;
  const scopeRaw = o.scope;
  const scope = (scopeRaw ? (typeof scopeRaw === 'string' ? JSON.parse(scopeRaw) : scopeRaw) : []) as Array<{ kind: string; id?: string }>;
  const tgt = scope.find((s) => (s.kind === 'asset' || s.kind === 'location') && s.id);
  const title = `${o.name}${o.norm_ref ? ` (${o.norm_ref})` : ''}`;

  if (o.spawn_task_kind === 'ot' && tgt && deps?.createMaintenanceOrder) {
    const ot = await deps.createMaintenanceOrder(db, ctx, {
      assetId: tgt.kind === 'asset' ? tgt.id : undefined,
      locationRef: tgt.kind === 'location' ? tgt.id : undefined,
      source: 'preventivo',
      priority: 'normal',
      title,
      dedupeKey,
      due: { dueDate },
      provenance: { module: 'compliance-certifications', eventKind: 'obligation_due', refId: o.id },
      payload: { obligationId: o.id, normRef: o.norm_ref },
    });
    return { taskId: ot.taskId, created: ot.taskCreated };
  }
  if (!deps?.triggerTaskFromEvent) return null;
  const trig = await deps.triggerTaskFromEvent(db, ctx, {
    source: { module: 'compliance-certifications', eventKind: 'obligation_due', refId: o.id },
    dedupeKey,
    kind: o.spawn_task_kind === 'ot' ? 'ot' : 'inspeccion',
    target: tgt ? { kind: tgt.kind as 'asset' | 'location', id: tgt.id! } : null,
    due: { dueDate },
    priority: 'normal',
    title,
    payload: { obligationId: o.id, normRef: o.norm_ref },
  });
  return { taskId: trig.task.id as string, created: trig.created };
}

// ── syncEventsFromTasks — closed obligation Tasks → cumplimiento ComplianceEvents (idempotent) ────
// Reads the obligation's Tasks (by linked rule for schedule_rule mode, else by provenance) and
// materializes one cumplimiento event per closed Task, idempotent on the (org, source_task_id)
// partial-unique. This is the loop closing back: work done → compliance recorded. listTasks is an
// injected dep (G24): when absent the loop-closer is a no-op (no tasks → nothing materialized).
export async function syncEventsFromTasks(db: DbOrTx, ctx: Context, input: { obligationId: string }, deps?: ComplianceDeps) {
  if (!can(ctx, 'compliance.events.record')) throw new ForbiddenError('compliance.events.record');
  const obligationId = uuid.parse(input.obligationId);
  const o = (await db.execute(sql`select id, schedule_rule_id from compliance_obligations where id = ${obligationId}::uuid`)) as unknown as Array<{ id: string; schedule_rule_id: string | null }>;
  if (!o.length) throw new FunctionError('OBLIGATION_NOT_FOUND');
  if (!deps?.listTasks) return { materialized: 0 };

  const tasks = o[0].schedule_rule_id
    ? await deps.listTasks(db, ctx, { scheduleRuleId: o[0].schedule_rule_id, status: ['closed'], page: 1, pageSize: 100 })
    : await deps.listTasks(db, ctx, { sourceModule: 'compliance-certifications', sourceRefId: obligationId, status: ['closed'], page: 1, pageSize: 100 });

  let materialized = 0;
  for (const t of tasks.rows as Array<{ id: string }>) {
    const ins = (await db.execute(sql`
      insert into compliance_events (org_id, obligation_id, kind, result, occurred_at, source_module, source_task_id, created_by)
      values (${ctx.orgId}::uuid, ${obligationId}::uuid, 'cumplimiento', 'cumplida', now(), 'compliance-certifications', ${t.id}::uuid, ${ctx.membershipId}::uuid)
      on conflict (org_id, source_task_id) where source_task_id is not null do nothing
      returning id
    `)) as unknown as Array<{ id: string }>;
    if (ins.length) materialized++;
  }
  if (materialized > 0) await recomputeNextDue(db, obligationId); // re-anchor the clock to actual completion
  return { materialized };
}

// ════════════════════════════════════════ ISSUED DOCUMENTS ══════════════════════════════════════
export async function nextSequence(db: DbOrTx, year: number): Promise<number> {
  // advisory lock per (org, year) keeps the MAX(seq)+1 race-free under the pooler.
  await db.execute(sql`select pg_advisory_xact_lock(hashtext('issued' || ${String(year)}))`);
  const rows = (await db.execute(sql`select coalesce(max(seq), 0) + 1 as next from issued_documents where year = ${year}`)) as unknown as Array<{ next: number }>;
  return rows[0]?.next ?? 1;
}

export async function bitacoraExport(db: DbOrTx, ctx: Context, input: { obligationId: string; from: string; to: string }) {
  if (!can(ctx, 'compliance.export.issue')) throw new ForbiddenError('compliance.export.issue');
  const obligationId = uuid.parse(input.obligationId);
  const o = (await db.execute(sql`select id, name, norm_ref, domain, authority from compliance_obligations where id = ${obligationId}::uuid`)) as unknown as Array<any>;
  if (!o.length) throw new FunctionError('OBLIGATION_NOT_FOUND');
  if (input.to < input.from) throw new FunctionError('INVALID_RANGE');

  const events = (await db.execute(sql`
    select id, kind, result, occurred_at, period_key, note, evidence, corrects_event_id
    from compliance_events where obligation_id = ${obligationId}::uuid and occurred_at::date between ${input.from} and ${input.to}
    order by occurred_at asc
  `)) as unknown as Array<Record<string, unknown>>;

  const year = new Date().getFullYear();
  const seq = await nextSequence(db, year);
  // De-hardcode the org label (copafix hard-coded 'Hotel Copacabana Acapulco') — read the tenant's
  // Org from identity-access for a multi-tenant catalog module; fall back to the orgId.
  const orgRows = (await db.execute(sql`select name, slug from orgs where id = ${ctx.orgId}::uuid`)) as unknown as Array<{ name: string; slug: string }>;
  const orgName = orgRows[0]?.name ?? ctx.orgId;
  const orgSlug = (orgRows[0]?.slug ?? 'ORG').toUpperCase();
  const number = `${orgSlug}-${year}-${String(seq).padStart(5, '0')}`;
  const snapshot = {
    obligation: { name: o[0].name, normRef: o[0].norm_ref, domain: o[0].domain, authority: o[0].authority },
    period: { from: input.from, to: input.to },
    rows: events,
    rowCount: events.length,
    org: orgName,
    issuedAtIso: new Date().toISOString(),
  };
  const actor = ctx.membershipId ? `member:${ctx.membershipId}` : ctx.actor ?? 'app';
  const ins = (await db.execute(sql`
    insert into issued_documents (org_id, kind, number, year, seq, title, obligation_id, norm_ref, period_from, period_to, snapshot, issued_by, created_by)
    values (${ctx.orgId}::uuid, 'bitacora_export', ${number}, ${year}, ${seq}, ${`Bitácora — ${o[0].name} (${input.from} a ${input.to})`}, ${obligationId}::uuid, ${o[0].norm_ref ?? null},
            ${input.from}, ${input.to}, ${JSON.stringify(snapshot)}::jsonb, ${actor}, ${ctx.membershipId}::uuid)
    returning id, number, title, status, issued_at, period_from, period_to
  `)) as unknown as Array<Record<string, unknown>>;
  return { issuedDocument: ins[0], rowCount: events.length };
}

export async function voidIssuedDocument(db: DbOrTx, ctx: Context, input: { id: string; reason: string }) {
  if (!can(ctx, 'compliance.export.issue')) throw new ForbiddenError('compliance.export.issue');
  const id = uuid.parse(input.id);
  if (!input.reason) throw new FunctionError('REASON_REQUIRED');
  const rows = (await db.execute(sql`select id, status from issued_documents where id = ${id}::uuid`)) as unknown as Array<{ id: string; status: string }>;
  if (!rows.length) throw new FunctionError('ISSUED_DOC_NOT_FOUND');
  if (rows[0].status === 'voided') throw new FunctionError('ALREADY_VOIDED');
  const actor = ctx.membershipId ? `member:${ctx.membershipId}` : ctx.actor ?? 'app';
  await db.execute(sql`update issued_documents set status = 'voided', voided_at = now(), voided_by = ${actor}, void_reason = ${input.reason}, updated_at = now() where id = ${id}::uuid`);
  return { id, status: 'voided' };
}

export const listIssuedInput = z.object({ kind: z.string().optional(), year: z.number().int().optional(), obligationId: uuid.optional(), status: z.string().optional() });
export async function listIssuedDocuments(db: DbOrTx, ctx: Context, input?: z.infer<typeof listIssuedInput>) {
  if (!can(ctx, 'compliance.documents.read')) throw new ForbiddenError('compliance.documents.read');
  const f = listIssuedInput.parse(input ?? {});
  const rows = (await db.execute(sql`
    select id, kind, number, title, obligation_id, period_from, period_to, status, issued_at, voided_at, void_reason
    from issued_documents
    where ${f.kind ? sql`kind = ${f.kind}` : sql`true`} ${f.year ? sql`and year = ${f.year}` : sql``}
      ${f.obligationId ? sql`and obligation_id = ${f.obligationId}::uuid` : sql``} ${f.status ? sql`and status = ${f.status}` : sql``}
    order by year desc, seq desc
  `)) as unknown as Array<Record<string, unknown>>;
  return rows;
}
