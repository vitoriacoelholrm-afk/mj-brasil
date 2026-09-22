// app cell — imports @app/* (resolved in the installed app), not catalog packages. This file is
// intentionally NOT catalog-typechecked: it is materialized into apps/web/src/modules/
// equipment-maintenance/ at install time, where @app/trpc and @app/db resolve. It is shipped here so
// the catalog carries the canonical tRPC surface (the anti-cycle deps wiring lives HERE).
//
// equipmentMaintenanceRouter — the asset registry over tRPC (equipment-maintenance spec §4). Every
// route is orgScopedProcedure (runs inside withTenant → RLS-scoped); each capability does its own
// can() check. recordMeterReading + completeMaintenanceOrder are offline command targets.
import { z } from 'zod';
import { router, orgScopedProcedure, type ScopedContext } from '../trpc.js';
import {
  createAsset, assetCreateInput,
  updateAsset, assetPatchInput,
  transitionAssetLifecycle, lifecycleInput,
  setAssetHealth, healthInput,
  listAssets, listAssetsInput,
  getAssetDetail, getAssetByQr, getAsset,
  createMeter, meterCreateInput,
  recordMeterReading, readingInput,
  outOfRangeToRequest, outOfRangeInput,
  listReadings, listReadingsInput,
  recordAssetEvent, assetEventInput,
  costPerAsset, costInput,
  createMaintenanceOrder, createMaintenanceOrderInput,
  completeMaintenanceOrder, completeMaintenanceOrderInput,
  getMaintenanceOrder, type EquipDeps,
  syncPmSchedules, pmCompliance, pmComplianceInput,
  consumptionForTask,
} from '@app/db';

const sc = (ctx: unknown) => ctx as ScopedContext;

// Anti-cycle wiring (§4.3): equipment reaches request-intake only through injected resolvers, so the
// db-package files never import request-intake back. createMaintenanceOrder is equipment's own OT
// creator (injected into the crear_tarea path).
function equipDepsFor(ctx: unknown): EquipDeps {
  const c = sc(ctx);
  return {
    createMaintenanceOrder: (input) => createMaintenanceOrder(c.db, c.identity, input as any, equipDepsFor(ctx)) as Promise<{ taskId: string; detailId: string }>,
    // materials-inventory cost seam (§10) — real refacciones cost at OT completion (try/catch → 0 when
    // materials isn't installed, so equipment degrades to the manual estimate). Wired only here (router).
    consumptionForTask: async (taskId) => { try { const r = await consumptionForTask(c.db, c.identity, { taskId }); return { totalCost: r.totalCost }; } catch { return { totalCost: 0 }; } },
  };
}

export const equipmentMaintenanceRouter = router({
  createAsset: orgScopedProcedure
    .input(assetCreateInput)
    .mutation(({ ctx, input }) => createAsset(sc(ctx).db, sc(ctx).identity, input)),

  updateAsset: orgScopedProcedure
    .input(assetPatchInput)
    .mutation(({ ctx, input }) => updateAsset(sc(ctx).db, sc(ctx).identity, input)),

  transitionAssetLifecycle: orgScopedProcedure
    .input(lifecycleInput)
    .mutation(({ ctx, input }) => transitionAssetLifecycle(sc(ctx).db, sc(ctx).identity, input)),

  setAssetHealth: orgScopedProcedure
    .input(healthInput)
    .mutation(({ ctx, input }) => setAssetHealth(sc(ctx).db, sc(ctx).identity, input)),

  listAssets: orgScopedProcedure
    .input(listAssetsInput.optional())
    .query(({ ctx, input }) => listAssets(sc(ctx).db, sc(ctx).identity, input)),

  getAssetDetail: orgScopedProcedure
    .input(z.object({ assetId: z.string().uuid() }))
    .query(({ ctx, input }) => getAssetDetail(sc(ctx).db, sc(ctx).identity, input)),

  getAssetByQr: orgScopedProcedure
    .input(z.object({ qrToken: z.string().min(1) }))
    .query(({ ctx, input }) => getAssetByQr(sc(ctx).db, sc(ctx).identity, input)),

  getAsset: orgScopedProcedure
    .input(z.object({ assetId: z.string().uuid() }))
    .query(({ ctx, input }) => getAsset(sc(ctx).db, sc(ctx).identity, input)),

  createMeter: orgScopedProcedure
    .input(meterCreateInput)
    .mutation(({ ctx, input }) => createMeter(sc(ctx).db, sc(ctx).identity, input)),

  recordMeterReading: orgScopedProcedure
    .input(readingInput)
    .mutation(({ ctx, input }) => recordMeterReading(sc(ctx).db, sc(ctx).identity, input, equipDepsFor(ctx))),

  outOfRangeToRequest: orgScopedProcedure
    .input(outOfRangeInput)
    .mutation(({ ctx, input }) => outOfRangeToRequest(sc(ctx).db, sc(ctx).identity, input, equipDepsFor(ctx))),

  listReadings: orgScopedProcedure
    .input(listReadingsInput.optional())
    .query(({ ctx, input }) => listReadings(sc(ctx).db, sc(ctx).identity, input)),

  recordAssetEvent: orgScopedProcedure
    .input(assetEventInput)
    .mutation(({ ctx, input }) => recordAssetEvent(sc(ctx).db, sc(ctx).identity, input)),

  costPerAsset: orgScopedProcedure
    .input(costInput.optional())
    .query(({ ctx, input }) => costPerAsset(sc(ctx).db, sc(ctx).identity, input)),

  createMaintenanceOrder: orgScopedProcedure
    .input(createMaintenanceOrderInput)
    .mutation(({ ctx, input }) => createMaintenanceOrder(sc(ctx).db, sc(ctx).identity, input, equipDepsFor(ctx))),

  completeMaintenanceOrder: orgScopedProcedure
    .input(completeMaintenanceOrderInput)
    .mutation(({ ctx, input }) => completeMaintenanceOrder(sc(ctx).db, sc(ctx).identity, input, equipDepsFor(ctx))),

  getMaintenanceOrder: orgScopedProcedure
    .input(z.object({ taskId: z.string().uuid() }))
    .query(({ ctx, input }) => getMaintenanceOrder(sc(ctx).db, sc(ctx).identity, input)),

  syncPmSchedules: orgScopedProcedure
    .input(z.object({ assetId: z.string().uuid() }))
    .mutation(({ ctx, input }) => syncPmSchedules(sc(ctx).db, sc(ctx).identity, input)),

  pmCompliance: orgScopedProcedure
    .input(pmComplianceInput.optional())
    .query(({ ctx, input }) => pmCompliance(sc(ctx).db, sc(ctx).identity, input)),
});
