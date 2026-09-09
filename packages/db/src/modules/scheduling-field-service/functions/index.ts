// scheduling-field-service capabilities barrel — the verbs + their pure FSM helpers + the injected-
// deps interface (SchedDeps). The app router wires SchedDeps.getTargetLabel (anti-cycle §4.3); the
// catalog ships only the declaration.
export {
  upsertScheduleRule, upsertRuleInput, type UpsertRuleInput,
  updateRule,
  generateTasks, generateTasksInput,
  transition, transitionInput, type TransitionInput,
  triggerTaskFromEvent, triggerInput, type TriggerInput,
  dailyBoard, listTasks, listTasksInput, getTask,
  confirmSchedule, assignTask, claimTask,
  type SchedDeps,
} from './functions.js';

// Pure FSM + recurrence helpers (the contract-test surface). isLegalTransition/legalNext stay
// internal (the contract test imports them straight from ./transitions.ts): both this module and
// facility-spaces define those generic names, so re-exporting them collides in @app/db's flat barrel (G20).
export {
  TASK_TRANSITIONS, TERMINAL_TASK, isTaskTerminal, needsVerification,
  RULE_TRANSITIONS, isLegalRuleTransition,
  FRECUENCIA_DIAS,
  parseIsoDate, toIsoDate, addDays, minIso, computeNextDueDates,
  type NextDuesInput, type NextDuesResult,
} from './transitions.js';
