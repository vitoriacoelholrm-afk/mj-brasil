// App DB schema — the aggregation point for every installed module's owned tables.
//
// On install, the `astralitics` CLI appends each module's owned entities here (and generates the
// Drizzle migration). Cross-module references are SOFT (plain uuid org_id, no FK). App-local
// tables live under ./app-local/ and are re-exported below.
//
// Chassis infrastructure tables are always present (not module-owned): sync_exceptions +
// idempotency_keys. The identity-access foundation (orgs + the login principal + the RBAC quad)
// is also always present — it's what resolves a request Context.
export * from './chassis/schema.js';
export * from './identity/schema.js';

export * from './entities/Document.js';
export * from './entities/AuditEvent.js';
export * from './entities/NotificationTemplate.js';
export * from './entities/Customer.js';
export * from './entities/Material.js';
export * from './entities/MaterialLot.js';
export * from './entities/StockMovement.js';
export * from './entities/ParLevel.js';
export * from './entities/ComplianceObligation.js';
export * from './entities/CredentialRecord.js';
export * from './entities/ComplianceEvent.js';
export * from './entities/IssuedDocument.js';
export * from './entities/ScheduleRule.js';
export * from './entities/ScheduleRuleItem.js';
export * from './entities/Task.js';
export * from './entities/TaskAssignment.js';
export * from './entities/Location.js';
export * from './entities/SpaceStatusEvent.js';
export * from './entities/Asset.js';
export * from './entities/AssetMeter.js';
export * from './entities/MeterReading.js';
export * from './entities/AssetEvent.js';
export * from './entities/MaintenanceOrderDetail.js';
// __MODULE_SCHEMA_EXPORTS__   <- install splices module entity re-exports here
