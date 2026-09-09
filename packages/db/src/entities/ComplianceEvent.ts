// Entity: ComplianceEvent  ·  Owner module: compliance-certifications
// The append-only gap-free chronology (cumplimiento/hallazgo/renovacion/anulacion/nota). Events are
// never updated. Cross-module refs (source_task_id → scheduling-field-service.tasks) are SOFT uuids —
// no FK (§6). The (org_id, source_task_id) uniqueness is a PARTIAL unique index `where source_task_id
// is not null` — the on-conflict target of syncEventsFromTasks. Drizzle's `unique()` can't express the
// partial predicate, so it is modeled here as a partial uniqueIndex (drizzle supports `.where()`); the
// migration SQL carries the same partial index as the source of truth.
// jsonb columns (evidence, reading_summary) are real jsonb in the SQL migration.
// Back-ported from copafix (packages/db/src/compliance-certifications/schema.ts).
import { jsonb, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { auditColumns, orgId, pkUuid, tsNow } from '../_shared.js';

export const complianceEvents = pgTable('compliance_events', {
  id: pkUuid(),
  orgId: orgId(),
  obligationId: uuid('obligation_id'),                         // soft → compliance_obligations
  credentialId: uuid('credential_id'),                        // soft → credential_records
  kind: text('kind').notNull(),                                // Definition compliance_event_kind
  result: text('result'),                                      // Definition compliance_event_result
  occurredAt: tsNow('occurred_at'),
  periodKey: text('period_key'),
  sourceModule: text('source_module'),
  sourceTaskId: uuid('source_task_id'),                       // soft → scheduling-field-service.tasks
  evidence: jsonb('evidence').notNull().default([]),
  readingSummary: jsonb('reading_summary'),
  correctsEventId: uuid('corrects_event_id'),                // self-ref → anulacion target
  note: text('note'),
  ...auditColumns,
}, (t) => ({
  // PARTIAL unique: only enforced when source_task_id is present (the loop-closer on-conflict target).
  srcUq: uniqueIndex('compliance_events_org_src_task_uq')
    .on(t.orgId, t.sourceTaskId)
    .where(sql`source_task_id is not null`),
}));

export const complianceEventCreateSchema = z.object({
  obligationId: z.string().uuid().optional(),
  credentialId: z.string().uuid().optional(),
  kind: z.string(),                                           // Definition compliance_event_kind
  result: z.string().optional(),                             // Definition compliance_event_result
  occurredAt: z.union([z.string(), z.date()]).optional(),
  periodKey: z.string().optional(),
  evidence: z.array(z.record(z.unknown())).default([]),
  correctsEventId: z.string().uuid().optional(),
  note: z.string().optional(),
});
export type ComplianceEventCreate = z.infer<typeof complianceEventCreateSchema>;
