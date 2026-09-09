// @astralitics/module-equipment-maintenance — public surface.
//
// The catalog's first back-ported DOMAIN module. The asset-registry slice (wave a) is live:
// Asset · AssetMeter · MeterReading · AssetEvent + their Functions. The OT facet (wave b,
// MaintenanceOrderDetail + createMaintenanceOrder/completeMaintenanceOrder/syncPmSchedules/
// pmCompliance) is now LIVE too — it hard-imports scheduling-field-service (the Task machine) +
// facility-spaces DOWN (G24); request-intake.triageToTask hard-calls createMaintenanceOrder.
//
// Functions follow the chassis contract: (db: DbOrTx, ctx: Context, input) — db arrives already
// tenant-scoped (RLS is the installed-app runtime's job, not the capability's). Cross-module back-calls
// (request-intake, the OT creator) are injected via EquipDeps and wired at the router (anti-cycle G24).
export * from './functions/index.js';

// The entities this module owns (re-exported from the global @astralitics/entities catalog).
export {
  assets, assetCreateSchema, type AssetCreate,
  assetMeters, assetMeterCreateSchema, type AssetMeterCreate,
  meterReadings, meterReadingCreateSchema, type MeterReadingCreate,
  assetEvents, assetEventCreateSchema, type AssetEventCreate,
  maintenanceOrderDetails, maintenanceOrderDetailCreateSchema, type MaintenanceOrderDetailCreate,
} from '@astralitics/entities';
