// Entity: Task  ·  Owner module: scheduling-field-service
// THE shared field-work machine (the gravitational center "la tarea", generalizes Rondo
// service_visits): one execution row, a kind-scoped status FSM whose SOLE writer is the
// transition() Function. Created either by the recurrence engine (schedule_rule_item_id + due_date)
// or as a one-off from another module's event (source_module + dedupe_key). Cross-module refs are
// soft uuids; target_label is a denormalized snapshot resolved via injected deps. Back-ported from copafix.
import { integer, pgTable, text, time, unique, uuid } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { auditColumns, orgId, pkUuid, tsNullable } from '../_shared.js';

export const tasks = pgTable('tasks', {
  id: pkUuid(),
  orgId: orgId(),
  kind: text('kind').notNull(),                              // Definition task_kind (immutable)
  status: text('status').notNull().default('planned'),      // Definition task_status (transition() is the SOLE writer)
  priority: text('priority').notNull().default('normal'),   // Definition prioridad
  title: text('title').notNull(),
  description: text('description'),
  targetKind: text('target_kind'),                          // Definition target_kind
  locationId: uuid('location_id'),                          // soft → facility-spaces.locations
  assetId: uuid('asset_id'),                                // soft → equipment-maintenance.assets
  targetLabel: text('target_label'),                        // denormalized snapshot (injected deps)
  scheduleRuleId: uuid('schedule_rule_id'),                 // soft → schedule_rules
  scheduleRuleItemId: uuid('schedule_rule_item_id'),        // soft → schedule_rule_items
  sourceModule: text('source_module'),
  sourceEventKind: text('source_event_kind'),
  sourceRefId: uuid('source_ref_id'),                       // soft polymorphic ref to the originating row
  dedupeKey: text('dedupe_key'),
  dueDate: text('due_date'),                                // ISO date
  dueAt: tsNullable('due_at'),
  scheduledDate: text('scheduled_date'),                    // ISO date
  scheduledWindowStart: time('scheduled_window_start'),
  scheduledWindowEnd: time('scheduled_window_end'),
  estimatedMinutes: integer('estimated_minutes'),
  actualStart: tsNullable('actual_start'),
  actualEnd: tsNullable('actual_end'),
  holdReason: text('hold_reason'),                          // Definition task_hold_reason
  holdStartedAt: tsNullable('hold_started_at'),
  holdMinutesTotal: integer('hold_minutes_total').notNull().default(0),
  completedAt: tsNullable('completed_at'),
  completedBy: text('completed_by'),
  closedAt: tsNullable('closed_at'),
  closedBy: text('closed_by'),
  reopenCount: integer('reopen_count').notNull().default(0),
  outcomeNote: text('outcome_note'),
  rescheduledToTaskId: uuid('rescheduled_to_task_id'),      // soft self-ref
  payload: text('payload').notNull().default('{}'),         // jsonb in SQL
  ...auditColumns,
}, (t) => ({
  // partial-unique indexes — see migrations/0001_scheduling_field_service.sql (the SQL is the source
  // of truth for the WHERE clauses drizzle's unique() can't express; re-declared here so they don't
  // silently vanish from generated DDL). dedupe + the per-item-per-due idempotency guard.
  dedupeUq: unique('tasks_org_dedupe_uq').on(t.orgId, t.dedupeKey),
  ruleItemDueUq: unique('tasks_org_rule_item_due_uq').on(t.orgId, t.scheduleRuleItemId, t.dueDate),
}));

export const taskCreateSchema = z.object({
  kind: z.string(),                                        // Definition task_kind
  priority: z.string().default('normal'),                 // Definition prioridad
  title: z.string().min(1),
  description: z.string().optional(),
  targetKind: z.string().optional(),                      // Definition target_kind
  locationId: z.string().uuid().optional(),
  assetId: z.string().uuid().optional(),
  scheduleRuleId: z.string().uuid().optional(),
  scheduleRuleItemId: z.string().uuid().optional(),
  sourceModule: z.string().optional(),
  sourceEventKind: z.string().optional(),
  sourceRefId: z.string().uuid().optional(),
  dedupeKey: z.string().optional(),
  dueDate: z.string().optional(),
  dueAt: z.string().optional(),
  scheduledDate: z.string().optional(),
  estimatedMinutes: z.number().int().optional(),
  payload: z.record(z.unknown()).default({}),
});
export type TaskCreate = z.infer<typeof taskCreateSchema>;
