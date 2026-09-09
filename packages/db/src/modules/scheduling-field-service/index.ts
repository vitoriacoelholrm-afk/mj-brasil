// @astralitics/module-scheduling-field-service — public surface.
//
// THE shared field-work machine (the gravitational center "la tarea"): the recurrence engine
// (ScheduleRule + ScheduleRuleItem → generateTasks) + the single Task execution machine + crew
// assignment. A LOW-LEVEL shared primitive (G24): equipment-maintenance / compliance-certifications /
// request-intake / vendor-management HARD-IMPORT these capabilities (triggerTaskFromEvent /
// transition / getTask / upsertScheduleRule / updateRule); scheduling's ONLY outward coupling is the
// optional SchedDeps.getTargetLabel resolver, injected by the app router (never an import) so the
// dependency graph stays acyclic.
//
// Back-ported from copafix (packages/db/src/scheduling-field-service). The capabilities are a faithful
// raw-SQL port; they assume `db` arrives already tenant-scoped (RLS/withTenant is the installed-app
// runtime's job — same contract as identity-access).

// Functions + their input schemas + the injected-deps interface + the pure FSM helpers.
export * from './functions/index.js';

// The entities this module owns (live in @astralitics/entities; re-exported for app convenience).
export {
  scheduleRules, scheduleRuleCreateSchema, type ScheduleRuleCreate,
  scheduleRuleItems, scheduleRuleItemCreateSchema, type ScheduleRuleItemCreate,
  tasks, taskCreateSchema, type TaskCreate,
  taskAssignments, taskAssignmentCreateSchema, type TaskAssignmentCreate,
} from '@astralitics/entities';
