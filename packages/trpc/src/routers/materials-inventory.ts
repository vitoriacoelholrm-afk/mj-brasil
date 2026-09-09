// app cell — imports @app/* (resolved in the installed app), not catalog packages. This file is
// excluded from the catalog typecheck (it typechecks in a scaffolded app via `astralitics verify-cells`).
//
// materialsInventoryRouter — the operational inventory over tRPC (spec §4). Every route is
// orgScopedProcedure (runs inside withTenant → RLS-scoped); each capability does its own can() check.
// Slice 1: catalog + receive + consume-against-Task + reverse + the cost read seams.
// consumeAgainstTask's Task guard is injected (getTask from scheduling) to keep the graph acyclic (G24).
import { z } from 'zod';
import { router, orgScopedProcedure, type ScopedContext } from '../trpc.js';
import {
  createMaterial, materialCreateInput,
  listMaterials, listMaterialsInput, getMaterial,
  receiveStock, receiveStockInput,
  consumeAgainstTask, consumeAgainstTaskInput,
  reverseMovement, reverseMovementInput,
  stockOnHand, consumptionForTask,
  getTask, type MaterialsDeps,
} from '@app/db';

const sc = (ctx: unknown) => ctx as ScopedContext;

// Anti-cycle wiring (§4.3): materials reaches scheduling only through an injected getTask resolver.
function materialsDepsFor(ctx: unknown): MaterialsDeps {
  const c = sc(ctx);
  return { getTask: (db, identity, input) => getTask(db, identity, input) as any };
}

export const materialsInventoryRouter = router({
  createMaterial: orgScopedProcedure.input(materialCreateInput).mutation(({ ctx, input }) => createMaterial(sc(ctx).db, sc(ctx).identity, input)),
  listMaterials: orgScopedProcedure.input(listMaterialsInput.optional()).query(({ ctx, input }) => listMaterials(sc(ctx).db, sc(ctx).identity, input)),
  getMaterial: orgScopedProcedure.input(z.object({ materialId: z.string().uuid() })).query(({ ctx, input }) => getMaterial(sc(ctx).db, sc(ctx).identity, input)),

  receiveStock: orgScopedProcedure.input(receiveStockInput).mutation(({ ctx, input }) => receiveStock(sc(ctx).db, sc(ctx).identity, input)),
  consumeAgainstTask: orgScopedProcedure.input(consumeAgainstTaskInput).mutation(({ ctx, input }) => consumeAgainstTask(sc(ctx).db, sc(ctx).identity, input, materialsDepsFor(ctx))),
  reverseMovement: orgScopedProcedure.input(reverseMovementInput).mutation(({ ctx, input }) => reverseMovement(sc(ctx).db, sc(ctx).identity, input)),

  stockOnHand: orgScopedProcedure.input(z.object({ materialId: z.string().uuid().optional(), locationId: z.string().uuid().optional(), kind: z.string().optional() }).optional()).query(({ ctx, input }) => stockOnHand(sc(ctx).db, sc(ctx).identity, input)),
  consumptionForTask: orgScopedProcedure.input(z.object({ taskId: z.string().uuid() })).query(({ ctx, input }) => consumptionForTask(sc(ctx).db, sc(ctx).identity, input)),
});
