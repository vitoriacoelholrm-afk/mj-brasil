// Entity: ScheduleRule  ·  Owner module: scheduling-field-service
// The recurrence rule (generalizes Rondo contracts): a kind-scoped, fixed-cadence generator with a
// lead-time horizon, duplicate suppression, and a draft→active→paused lifecycle. Its items (the
// polymorphic scope) live in ScheduleRuleItem. sourceKey is the upsert idempotency anchor used by
// equipment.syncPmSchedules / vendor.syncContractSchedule. Back-ported from copafix.
import { boolean, integer, pgTable, text, unique, uuid } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { auditColumns, orgId, pkUuid } from '../_shared.js';

export const scheduleRules = pgTable('schedule_rules', {
  id: pkUuid(),
  orgId: orgId(),
  name: text('name').notNull(),
  description: text('description'),
  kind: text('kind').notNull(),                                      // Definition task_kind (immutable rule scope)
  scheduleMode: text('schedule_mode').notNull().default('fixed'),    // Definition schedule_mode
  defaultFrequencyDays: integer('default_frequency_days').notNull().default(30),
  leadTimeDays: integer('lead_time_days').notNull().default(14),
  graceDays: integer('grace_days').notNull().default(2),
  duplicateSuppression: text('duplicate_suppression').notNull().default('while_open'), // Definition duplicate_suppression
  autoSchedule: boolean('auto_schedule').notNull().default(false),
  seasonalWindows: text('seasonal_windows'),                         // jsonb in SQL (nullable; floating mode is a stub)
  startDate: text('start_date').notNull(),                           // ISO date (no time component)
  endDate: text('end_date'),                                         // ISO date
  status: text('status').notNull().default('draft'),                // Definition schedule_rule_status (transition-only via updateRule)
  defaultPriority: text('default_priority').notNull().default('normal'), // Definition prioridad
  defaultEstimatedMinutes: integer('default_estimated_minutes'),
  defaultPayload: text('default_payload').notNull().default('{}'),   // jsonb in SQL
  sourceKey: text('source_key'),                                     // upsert idempotency key
  ...auditColumns,
}, (t) => ({
  // partial-unique: see migrations/0001_scheduling_field_service.sql (WHERE source_key IS NOT NULL).
  srcUq: unique('schedule_rules_org_source_key_uq').on(t.orgId, t.sourceKey),
}));

export const scheduleRuleCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  kind: z.string(),                                                  // Definition task_kind
  scheduleMode: z.string().default('fixed'),                        // Definition schedule_mode
  defaultFrequencyDays: z.number().int().min(1).default(30),
  leadTimeDays: z.number().int().min(0).default(14),
  graceDays: z.number().int().min(0).default(2),
  duplicateSuppression: z.string().default('while_open'),           // Definition duplicate_suppression
  autoSchedule: z.boolean().default(false),
  startDate: z.string(),
  endDate: z.string().optional(),
  status: z.string().optional(),                                    // Definition schedule_rule_status
  defaultPriority: z.string().default('normal'),                   // Definition prioridad
  defaultEstimatedMinutes: z.number().int().optional(),
  defaultPayload: z.record(z.unknown()).default({}),
  sourceKey: z.string().optional(),
});
export type ScheduleRuleCreate = z.infer<typeof scheduleRuleCreateSchema>;
