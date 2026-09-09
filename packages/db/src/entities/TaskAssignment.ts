// Entity: TaskAssignment  ·  Owner module: scheduling-field-service
// M2M crew on a Task. role (lead/apoyo) carries the dispatch model; one LIVE lead per task and one
// LIVE membership per task are enforced by two partial-unique indexes (released_at IS NULL) that
// claimTask + assignTask depend on for their concurrency/idempotency guarantee — see
// migrations/0001_scheduling_field_service.sql (the WHERE clauses are SQL-only). Back-ported from copafix.
import { pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { auditColumns, orgId, pkUuid, tsNullable } from '../_shared.js';

export const taskAssignments = pgTable('task_assignments', {
  id: pkUuid(),
  orgId: orgId(),
  taskId: uuid('task_id').notNull(),                       // soft → tasks (intra-module; no FK §6)
  membershipId: uuid('membership_id').notNull(),          // soft → identity-access.memberships
  role: text('role').notNull().default('apoyo'),          // Definition assignment_role
  assignedBy: text('assigned_by'),
  claimedAt: tsNullable('claimed_at'),
  releasedAt: tsNullable('released_at'),
  ...auditColumns,
});
// NOTE: the one-live-lead-per-task and one-live-membership-per-task partial-unique indexes are
// declared ONLY in the SQL migration (drizzle's unique() can't express the released_at IS NULL
// partial); they are load-bearing for claimTask/assignTask. Do not assume the entity DDL alone
// regenerates them.

export const taskAssignmentCreateSchema = z.object({
  taskId: z.string().uuid(),
  membershipId: z.string().uuid(),
  role: z.string().default('apoyo'),                      // Definition assignment_role
  assignedBy: z.string().optional(),
});
export type TaskAssignmentCreate = z.infer<typeof taskAssignmentCreateSchema>;
