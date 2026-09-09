// equipment-maintenance — Function barrel. The registry-slice verbs (wave a) + the OT facet (wave b)
// + the pure FSM helpers the contract test pins + the EquipDeps type the app wires at the router
// (anti-cycle, G24).

// OT facet (wave b) — the shared OT creator + completion + PM scheduling/compliance (the satellite
// pattern, G11). Hard-imports scheduling-field-service (the Task machine) + facility-spaces DOWN; the
// crear_tarea path of outOfRangeToRequest + request-intake.triageToTask now call this creator directly.
export {
  createMaintenanceOrder, createMaintenanceOrderInput, type CreateMaintenanceOrderInput,
  completeMaintenanceOrder, completeMaintenanceOrderInput, type CompleteMaintenanceOrderInput,
  syncPmSchedules,
  pmCompliance, pmComplianceInput,
  getMaintenanceOrder,
} from './orders.js';

// assets
export { createAsset, assetCreateInput, type AssetCreateInput } from './assets.js';
export { updateAsset, assetPatchInput, type AssetPatchInput } from './assets.js';
export { transitionAssetLifecycle, lifecycleInput, type LifecycleInput } from './assets.js';
export { setAssetHealth, healthInput, type HealthInput } from './assets.js';
export { listAssets, listAssetsInput, type ListAssetsInput } from './assets.js';
export { getAssetDetail, getAssetByQr, getAsset } from './assets.js';
export { recordAssetEvent, assetEventInput, type AssetEventInput } from './assets.js';

// meters + readings + the out-of-range loop-closer
export { createMeter, meterCreateInput, type MeterCreateInput } from './meters.js';
export { recordMeterReading, readingInput, type ReadingInput } from './meters.js';
export { outOfRangeToRequest, outOfRangeInput } from './meters.js';
export { listReadings, listReadingsInput } from './meters.js';
export { type EquipDeps } from './meters.js';

// costs
export { costPerAsset, costInput } from './costs.js';

// pure FSM + range helpers (the contract-test surface)
export {
  ASSET_LIFECYCLE_TRANSITIONS,
  isLegalLifecycle,
  isRetire,
  isHealth,
  healthRequiresNote,
  evaluateRange,
} from './transitions.js';
