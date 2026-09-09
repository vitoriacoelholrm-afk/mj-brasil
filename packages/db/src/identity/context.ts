// The per-request Context spine + the permission check — the contract every capability consumes
// (identity-access). Mirrors the installed cell's types.ts / can(). The actor string distinguishes
// human vs agent for the audit trail: 'member:<id>' | 'mcp:<principal>:<session>' | 'app'.
export interface Context {
  orgId: string;
  membershipId: string | null;
  actor: string;
  rbacRole: 'admin' | 'executive' | 'employee' | null;
  permissions: ReadonlySet<string>; // dotted capability keys; admin = {'*'}
}

/** True if the context may perform `capability`. '*' (admin) wins; otherwise exact key match. */
export function can(ctx: Context, capability: string): boolean {
  return ctx.permissions.has('*') || ctx.permissions.has(capability);
}

/** Raised by a capability when the Context lacks the required permission. */
export class ForbiddenError extends Error {
  code = 'FORBIDDEN' as const;
  constructor(capability: string) {
    super(`forbidden: missing permission '${capability}'`);
  }
}
