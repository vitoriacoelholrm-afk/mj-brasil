// @app/db — the app's database client + schema (the chassis spine barrel).
// The client connects to this app's own Supabase (per stage, via the supabase-keys Connection).
// Module functions run under the RLS-respecting role; the admin role is reserved for
// migrations/admin only (APP_FACTORY.md §14.6). Domain modules add their capability exports here
// on install; the spine ships the chassis + identity-access foundation only.
export * as schema from './schema.js';
export { appDb, adminDb, _raw } from './client.js';
export { withTenant, forEachOrg } from './chassis/withTenant.js';
export type { Tx } from './chassis/withTenant.js';
export { rateLimit, type RateLimitResult } from './chassis/rateLimit.js';

// identity-access (foundation): the Context spine + the db-backed resolver + the "who am I" read.
export { type Context, can, ForbiddenError } from './identity/context.js';
export { resolveContext, type Principal, type ResolveInput } from './identity/resolveContext.js';
export { getMembershipProfile, type MembershipProfile } from './identity/profile.js';
// DbOrTx — the capability db-handle type (top-level db OR a tenant tx). Installed domain-module
// capabilities import it from @astralitics/module-identity-access, which the install aliases to @app/db.
export type { DbOrTx } from './identity/dbOrTx.js';

// chassis capabilities exposed to routers (the offline sync-exception surface).
export {
  listSyncExceptions, listFilter, type ListFilter,
  resolveSyncException, resolveSyncExceptionInput, type ResolveSyncExceptionInput,
  recordSyncException,
} from './chassis/syncExceptions.js';

// the durable command layer (ADR-12) — exactly-once replay for the offline drainer.
export {
  withIdempotency, hashPayload, DuplicateCommandError, IdempotencyConflictError,
} from './chassis/idempotency.js';

// domain errors (modules contribute their own NOT_FOUND codes).
export { FunctionError, NOT_FOUND_CODES } from './_errors.js';

export * from './modules/platform-core/index.js';
export * from './modules/customer-management/index.js';
export * from './modules/materials-inventory/index.js';
export * from './modules/compliance-certifications/index.js';
export * from './modules/scheduling-field-service/index.js';
export * from './modules/facility-spaces/index.js';
export * from './modules/equipment-maintenance/index.js';
// __MODULE_DB_EXPORTS__   <- install splices module capability re-exports here

// app-local: os registros do sistema da qualidade (os formulários da ISO 9001 desta aplicação).
export {
  criarRegistro, criarRegistroInput,
  listarRegistros, listarRegistrosInput,
  lerAnexo, lerAnexoInput,
} from './app-local/registros.js';
