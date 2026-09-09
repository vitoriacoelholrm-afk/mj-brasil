// The app's single OutboxDb instance + the command-type registry bootstrap. On install the control-plane
// calls registerCommand() per module from its `offline.commands` manifest, so the drainer knows
// which canonical <module>.<Function> command types it may replay. The spine ships with NO commands
// registered — a fresh app has no offline domain surface until a module that declares one is installed.
import { OutboxDb } from './outbox';

export const outboxDb = new OutboxDb('mj-brasil-outbox');

registerCommand('materials-inventory.receiveStock');
registerCommand('materials-inventory.consumeAgainstTask');
registerCommand('compliance-certifications.upsertCredentialRecord');
registerCommand('compliance-certifications.recordComplianceEvent');
registerCommand('scheduling-field-service.transition');
registerCommand('scheduling-field-service.claimTask');
registerCommand('facility-spaces.applyStatusTransition');
registerCommand('equipment-maintenance.recordMeterReading');
registerCommand('equipment-maintenance.completeMaintenanceOrder');
// __OFFLINE_COMMAND_REGISTRATIONS__   <- install splices registerCommand('<module>.<Function>') here
// e.g.  for (const t of ['facility-spaces.applyStatusTransition']) registerCommand(t);
