// Entity: ComplianceObligation  ·  Owner module: compliance-certifications
// The normative requirement with cadence — the catalog side of the single vencimientos engine.
// Cross-module refs (schedule_rule_id, vendor_id) are SOFT uuids — no FK (§6). jsonb columns
// (scope, evidence_requirements) are real jsonb in the SQL migration; the round-trip note says to
// prefer real jsonb here because scope/evidenceRequirements are queried as jsonb.
// Back-ported from copafix (packages/db/src/compliance-certifications/schema.ts).
import { integer, jsonb, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { auditColumns, orgId, pkUuid } from '../_shared.js';

export const complianceObligations = pgTable('compliance_obligations', {
  id: pkUuid(),
  orgId: orgId(),
  name: text('name').notNull(),
  normRef: text('norm_ref'),
  authority: text('authority'),
  domain: text('domain').notNull().default('interno'),          // Definition compliance_domain
  description: text('description'),
  riskNote: text('risk_note'),
  fulfillmentMode: text('fulfillment_mode').notNull(),          // Definition obligation_fulfillment_mode
  frequencyDays: integer('frequency_days'),
  graceDays: integer('grace_days').notNull().default(5),
  scheduleRuleId: uuid('schedule_rule_id'),                     // soft → scheduling-field-service.schedule_rules
  requiredCredentialKind: text('required_credential_kind'),     // Definition credential_kind
  scope: jsonb('scope'),
  evidenceRequirements: jsonb('evidence_requirements').notNull().default([]),
  responsibleKind: text('responsible_kind').notNull().default('interno'), // Definition obligation_responsible
  vendorId: uuid('vendor_id'),                                  // soft → vendor-management.vendors
  spawnTaskKind: text('spawn_task_kind'),                       // Definition task_kind (owner scheduling)
  spawnLeadDays: integer('spawn_lead_days').notNull().default(14),
  retentionYears: integer('retention_years'),
  nextDueDate: text('next_due_date'),                           // date (no time component)
  status: text('status').notNull().default('draft'),           // Definition obligation_status
  anchorDate: text('anchor_date'),                             // date (no time component)
  ...auditColumns,
});

export const complianceObligationCreateSchema = z.object({
  name: z.string().min(1),
  normRef: z.string().optional(),
  authority: z.string().optional(),
  domain: z.string().default('interno'),                       // Definition compliance_domain
  description: z.string().optional(),
  riskNote: z.string().optional(),
  fulfillmentMode: z.string(),                                 // Definition obligation_fulfillment_mode
  frequencyDays: z.number().int().nullable().optional(),
  graceDays: z.number().int().optional(),
  scheduleRuleId: z.string().uuid().optional(),
  requiredCredentialKind: z.string().optional(),
  scope: z.array(z.record(z.unknown())).optional(),
  evidenceRequirements: z.array(z.string()).default([]),
  responsibleKind: z.string().default('interno'),             // Definition obligation_responsible
  vendorId: z.string().uuid().optional(),
  spawnTaskKind: z.string().optional(),                       // Definition task_kind
  spawnLeadDays: z.number().int().optional(),
  retentionYears: z.number().int().optional(),
  anchorDate: z.string().optional(),
});
export type ComplianceObligationCreate = z.infer<typeof complianceObligationCreateSchema>;
