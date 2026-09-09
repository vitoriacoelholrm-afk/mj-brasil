// @astralitics/module-customer-management — public surface.
//
// The sell-side relationship domain (the counterpart to vendor-management): Customer = who an app
// bills/serves (residential | commercial | fleet). Ships the Customer status-machine verb plus the
// CRUD/query verbs (createCustomer, listCustomers, updateCustomer, setCustomerStatus), ported from
// Rondo. Functions follow the chassis contract: (db: DbOrTx, ctx: Context, input). See
// docs/MODULE_AUTHORING.md.
export * from './functions/index.js';

// The entities this module owns (re-exported from the global @astralitics/entities catalog).
export { customers, customerCreateSchema, type CustomerCreate } from '@astralitics/entities';
