// app cell — imports @app/* (resolved in the installed app), not catalog packages. This file is
// intentionally NOT catalog-typechecked: it is materialized into apps/web/src/modules/facility-spaces/
// at install time, where @app/trpc + @app/db resolve to the generated app barrels.
//
// facilitySpacesRouter — the room/space surface over tRPC (facility-spaces spec §4). Every route is
// orgScopedProcedure (runs inside withTenant → RLS-scoped); each capability does its own can() check.
// applyStatusTransition is the offline command target (manifest offline.commands).
import { z } from 'zod';
import { router, orgScopedProcedure, type ScopedContext } from '../trpc.js';
import {
  applyStatusTransition, applyStatusTransitionInput,
  getCurrentHouse, houseFilter,
  getLocationTree, treeFilter,
  getLocation, getStatusHistory, getLegalTransitions,
} from '@app/db';

const sc = (ctx: unknown) => ctx as ScopedContext;

export const facilitySpacesRouter = router({
  applyStatusTransition: orgScopedProcedure
    .input(applyStatusTransitionInput)
    .mutation(({ ctx, input }) => applyStatusTransition(sc(ctx).db, sc(ctx).identity, input)),

  getCurrentHouse: orgScopedProcedure
    .input(houseFilter.optional())
    .query(({ ctx, input }) => getCurrentHouse(sc(ctx).db, sc(ctx).identity, input)),

  getLocationTree: orgScopedProcedure
    .input(treeFilter.optional())
    .query(({ ctx, input }) => getLocationTree(sc(ctx).db, sc(ctx).identity, input)),

  getLocation: orgScopedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(({ ctx, input }) => getLocation(sc(ctx).db, sc(ctx).identity, input)),

  getStatusHistory: orgScopedProcedure
    .input(z.object({ locationId: z.string().uuid(), limit: z.number().int().optional() }))
    .query(({ ctx, input }) => getStatusHistory(sc(ctx).db, sc(ctx).identity, input)),

  getLegalTransitions: orgScopedProcedure
    .input(z.object({ locationId: z.string().uuid() }))
    .query(({ ctx, input }) => getLegalTransitions(sc(ctx).db, sc(ctx).identity, input)),
});
