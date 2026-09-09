// FunctionError — a domain rejection from a capability, carrying a stable `code`. The tRPC layer
// maps the code to an HTTP/tRPC status; the offline drainer treats a domain rejection as terminal
// (non-retryable) and records a SyncException. Distinct from a transient/transport failure (retry).
export class FunctionError extends Error {
  constructor(public code: string, message?: string) {
    super(message ?? code);
    this.name = 'FunctionError';
  }
}

// Codes that mean "not found" (→ NOT_FOUND); everything else with a code is a BAD_REQUEST-class
// domain rejection. The spine ships only the generic code; installed modules contribute their own
// <ENTITY>_NOT_FOUND codes (the catalog convention) — extend this set in app-local/module code.
export const NOT_FOUND_CODES = new Set([
  'NOT_FOUND',
  'MEMBER_NOT_FOUND',
  'ROLE_NOT_FOUND',
  'LOT_NOT_FOUND',
  'MATERIAL_NOT_FOUND',
  'MOVEMENT_NOT_FOUND',
  'CREDENTIAL_NOT_FOUND',
  'ISSUED_DOC_NOT_FOUND',
  'OBLIGATION_NOT_FOUND',
  'RULE_NOT_FOUND',
  'TASK_NOT_FOUND',
  'LOCATION_NOT_FOUND',
  'ASSET_NOT_FOUND',
  'MAINTENANCE_ORDER_NOT_FOUND',
  'METER_NOT_FOUND',
  'QR_NOT_FOUND',
  'READING_NOT_FOUND',
  // __MODULE_NOT_FOUND_CODES__   <- install splices each module's <ENTITY>_NOT_FOUND codes here
]);
