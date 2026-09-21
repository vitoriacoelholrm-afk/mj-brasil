// The app router — one sub-router per installed module + chassis + identity. The spine ships only
// the chassis (offline sync-exception surface) + identity ("who am I") routers; each installed
// domain module's router mounts here (at the splice marker) as it is installed.
import { customerManagementRouter } from './customer-management.js';
import { materialsInventoryRouter } from './materials-inventory.js';
import { complianceCertificationsRouter } from './compliance-certifications.js';
import { schedulingFieldServiceRouter } from './scheduling-field-service.js';
import { facilitySpacesRouter } from './facility-spaces.js';
import { equipmentMaintenanceRouter } from './equipment-maintenance.js';
import { router } from '../trpc.js';
import { chassisRouter } from './chassis.js';
import { identityRouter } from './identity.js';
import { registrosRouter } from './registros.js';
import { documentosRouter } from './documentos.js';

export const appRouter = router({
  identity: identityRouter,
  chassis: chassisRouter,
  'customer-management': customerManagementRouter,
  'materials-inventory': materialsInventoryRouter,
  'compliance-certifications': complianceCertificationsRouter,
  'scheduling-field-service': schedulingFieldServiceRouter,
  'facility-spaces': facilitySpacesRouter,
  'equipment-maintenance': equipmentMaintenanceRouter,
  // __MODULE_ROUTER_MOUNTS__   <- install splices module routers here
  // app-local: os formulários da ISO 9001 desta aplicação.
  registros: registrosRouter,
  documentos: documentosRouter,
});

export type AppRouter = typeof appRouter;
