// The procedure ladder (_chassis.md §1.5, Beamy pattern). The load-bearing rung is
// orgScopedProcedure: it resolves the Context, then runs the resolver INSIDE withTenant(orgId) so
// every db query the handler makes is RLS-scoped by construction. No domain router uses
// publicProcedure (check:procedures lints it).
import { initTRPC, TRPCError } from '@trpc/server';
import { withTenant, resolveContext, type Context, type Tx } from '@app/db';

/** What the HTTP adapter's createContext produces (pre-tenant). */
export interface RequestContext {
  auth: { authUserId?: string | null; membershipId?: string | null } | null;
  activeOrgId?: string | null;
  /** Best-effort client IP (x-forwarded-for chain head) — used to rate-limit the anonymous public surface. */
  ip?: string | null;
}

/** What an org-scoped resolver receives: the request context + the tenant tx + the identity Context. */
export interface ScopedContext extends RequestContext {
  db: Tx;
  identity: Context;
}

const t = initTRPC.context<RequestContext>().create();

export const router = t.router;
export const middleware = t.middleware;

/** publicProcedure — ONLY public QR intake + auth endpoints. */
export const publicProcedure = t.procedure;

/** protectedProcedure — a valid session, org not yet resolved. */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.auth || (!ctx.auth.authUserId && !ctx.auth.membershipId)) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'no session' });
  }
  return next({ ctx });
});

// Codes that mean "not found"; mirrors @app/db NOT_FOUND_CODES (kept inline to avoid a runtime dep).
// The spine ships the generic code only; installed modules add their <ENTITY>_NOT_FOUND codes here.
const NOT_FOUND = new Set([
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
  'ANEXO_NOT_FOUND',   // app-local: os registros do SGQ
  // __MODULE_NOT_FOUND_CODES__   <- install splices each module's <ENTITY>_NOT_FOUND codes here
]);

function mapError(e: unknown): never {
  if (e instanceof TRPCError) throw e;
  const code = (e as { code?: string })?.code;
  const msg = (e as Error)?.message ?? 'error';
  if (code === 'FORBIDDEN' || msg.startsWith('forbidden')) throw new TRPCError({ code: 'FORBIDDEN', message: msg });
  if (msg === 'NO_MEMBERSHIP') throw new TRPCError({ code: 'FORBIDDEN', message: 'no active membership' });
  if (msg === 'NOT_A_MEMBER_OF_ACTIVE_ORG') throw new TRPCError({ code: 'FORBIDDEN', message: msg });
  if (code && NOT_FOUND.has(code)) throw new TRPCError({ code: 'NOT_FOUND', message: code });
  if (msg === 'NOT_FOUND') throw new TRPCError({ code: 'NOT_FOUND' });
  if (msg === 'INVALID_TRANSITION') throw new TRPCError({ code: 'CONFLICT', message: 'already terminal' });
  // any capability with a stable code is a non-retryable domain rejection → BAD_REQUEST
  if (typeof code === 'string') throw new TRPCError({ code: 'BAD_REQUEST', message: code });
  throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: msg, cause: e });
}

/** orgScopedProcedure — THE default (~99% of routes). resolveContext → withTenant(orgId) → handler.
 *  The handler runs inside the tenant transaction; its db queries (ctx.db) are RLS-scoped. */
export const orgScopedProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  let identity: Context;
  try {
    identity = await resolveContext({ principal: ctx.auth!, activeOrgId: ctx.activeOrgId ?? null });
  } catch (e) {
    return mapError(e);
  }
  try {
    // The resolver runs INSIDE the tenant tx. tRPC's next() doesn't throw on a resolver error —
    // it returns { ok: false }. We must throw the original cause inside withTenant so the
    // transaction ROLLS BACK on failure (otherwise a half-written mutation would commit), then
    // map it to a proper TRPCError code outside.
    return await withTenant(identity.orgId, async (tx) => {
      const result = await next({ ctx: { ...ctx, db: tx, identity } as ScopedContext });
      // Access the error branch via a cast so the build doesn't depend on cross-version
      // discriminated-union narrowing of tRPC's MiddlewareResult.
      if (!result.ok) { const e = result as unknown as { error?: TRPCError }; throw e.error?.cause ?? e.error; }
      return result;
    });
  } catch (e) {
    return mapError(e);
  }
});

/** orgAdminProcedure — org-scoped + admin tier. */
export const orgAdminProcedure = orgScopedProcedure.use(({ ctx, next }) => {
  const sc = ctx as unknown as ScopedContext;
  if (sc.identity.rbacRole !== 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: 'admin only' });
  return next();
});
