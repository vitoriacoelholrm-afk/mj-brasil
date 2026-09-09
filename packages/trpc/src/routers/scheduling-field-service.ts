// app cell — imports @app/* (resolved in the installed app), NOT catalog packages. This file is
// intentionally NOT catalog-typechecked: it is materialized into each installed app's tRPC layer
// where @app/trpc + @app/db barrels exist. It owns the anti-cycle wiring (§4.3): depsFor(ctx) builds
// SchedDeps.getTargetLabel by calling equipment-maintenance.getAsset / facility-spaces.getLocation,
// passing it as the 4th arg to generateTasks + triggerTaskFromEvent so the catalog capability layer
// stays import-clean. Copied from copafix packages/trpc/src/routers/scheduling-field-service.ts.
//
// schedulingFieldServiceRouter — THE Task machine over tRPC (spec §4). Every route is
// orgScopedProcedure (RLS-scoped); each capability gates. FunctionError.code → tRPC status is the
// app trpc layer's job (NOT_FOUND_CODES extended with TASK_NOT_FOUND, RULE_NOT_FOUND → NOT_FOUND).
import { z } from 'zod';
import { router, orgScopedProcedure, type ScopedContext } from '../trpc.js';
import {
  upsertScheduleRule, upsertRuleInput, updateRule,
  generateTasks, generateTasksInput,
  transition, transitionInput,
  triggerTaskFromEvent, triggerInput,
  dailyBoard, listTasks, listTasksInput, getTask,
  confirmSchedule, assignTask, claimTask,
  getAsset, getLocation, type SchedDeps,
} from '@app/db';

const sc = (ctx: unknown) => ctx as ScopedContext;

function depsFor(ctx: unknown): SchedDeps {
  const c = sc(ctx);
  return {
    getTargetLabel: async (kind, id) => {
      try {
        if (kind === 'asset') return (await getAsset(c.db, c.identity, { assetId: id })).label;
        return (await getLocation(c.db, c.identity, { id })).label;
      } catch { return null; }
    },
  };
}

export const schedulingFieldServiceRouter = router({
  upsertScheduleRule: orgScopedProcedure.input(upsertRuleInput).mutation(({ ctx, input }) => upsertScheduleRule(sc(ctx).db, sc(ctx).identity, input)),
  updateRule: orgScopedProcedure.input(z.object({ ruleId: z.string().uuid(), status: z.string().optional(), patch: z.record(z.unknown()).optional() })).mutation(({ ctx, input }) => updateRule(sc(ctx).db, sc(ctx).identity, input)),
  generateTasks: orgScopedProcedure.input(generateTasksInput.optional()).mutation(({ ctx, input }) => generateTasks(sc(ctx).db, sc(ctx).identity, input, depsFor(ctx))),

  transition: orgScopedProcedure.input(transitionInput).mutation(({ ctx, input }) => transition(sc(ctx).db, sc(ctx).identity, input)),
  triggerTaskFromEvent: orgScopedProcedure.input(triggerInput).mutation(({ ctx, input }) => triggerTaskFromEvent(sc(ctx).db, sc(ctx).identity, input, depsFor(ctx))),

  dailyBoard: orgScopedProcedure.input(z.object({ date: z.string().optional(), kind: z.string().optional(), membershipId: z.string().uuid().optional() }).optional()).query(({ ctx, input }) => dailyBoard(sc(ctx).db, sc(ctx).identity, input)),
  listTasks: orgScopedProcedure.input(listTasksInput.optional()).query(({ ctx, input }) => listTasks(sc(ctx).db, sc(ctx).identity, input)),
  getTask: orgScopedProcedure.input(z.object({ taskId: z.string().uuid() })).query(({ ctx, input }) => getTask(sc(ctx).db, sc(ctx).identity, input)),

  confirmSchedule: orgScopedProcedure.input(z.object({ taskIds: z.array(z.string().uuid()), scheduledDate: z.string().optional() })).mutation(({ ctx, input }) => confirmSchedule(sc(ctx).db, sc(ctx).identity, input)),
  assignTask: orgScopedProcedure.input(z.object({ taskId: z.string().uuid(), members: z.array(z.object({ membershipId: z.string().uuid(), role: z.string().optional() })), releaseOthers: z.boolean().optional() })).mutation(({ ctx, input }) => assignTask(sc(ctx).db, sc(ctx).identity, input)),
  claimTask: orgScopedProcedure.input(z.object({ taskId: z.string().uuid() })).mutation(({ ctx, input }) => claimTask(sc(ctx).db, sc(ctx).identity, input)),
});
