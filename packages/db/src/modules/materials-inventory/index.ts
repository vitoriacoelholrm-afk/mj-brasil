// @astralitics/module-materials-inventory — public surface.
//
// The Rondo lot/movement inventory pattern generalized: a Material catalog, optional lot/expiry
// tracking (MaterialLot), the append-only signed StockMovement ledger (corrections = compensating
// rows), and ParLevel config. Slice 1 is the refacción → consume-against-Task → per-asset cost path:
// `consumptionForTask` is THE seam equipment-maintenance.costPerAsset consumes for real parts cost.
//
// Functions follow the chassis contract: (db: DbOrTx, ctx: Context, input) — db arrives already
// tenant-scoped. The scheduling Task guard is injected via MaterialsDeps.getTask, wired at the router
// (anti-cycle G24: materials hard-imports nothing back into scheduling/equipment).
export * from './functions/index.js';

// The entities this module owns (re-exported from the global @astralitics/entities catalog).
export {
  materials, materialCreateSchema, type MaterialCreate,
  materialLots, materialLotCreateSchema, type MaterialLotCreate,
  stockMovements, stockMovementCreateSchema, type StockMovementCreate,
  parLevels, parLevelCreateSchema, type ParLevelCreate,
} from '@astralitics/entities';
