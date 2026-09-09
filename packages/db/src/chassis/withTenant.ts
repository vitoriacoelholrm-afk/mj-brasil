// withTenant — THE single chokepoint to the database under tenancy (spec _chassis.md §1.2,
// ADR-11/16). No domain code ever calls set_config; the only callers are orgScopedProcedure
// (the tRPC middleware) and forEachOrg (the cron helper). The GUC is transaction-local
// (set_config(..., true)) so it evaporates on commit/rollback — the property that makes the
// pattern safe over Supabase's transaction-mode pooler (proven by the pooler-reuse test).
import { sql } from 'drizzle-orm';
import type { PgTransaction } from 'drizzle-orm/pg-core';
import { appDb, adminDb } from '../client.js';

export type Tx = PgTransaction<any, any, any>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Run `fn` inside a transaction whose first statement pins the tenant GUC. Every business-table
 *  query MUST obtain its db handle this way; a query made any other way fails closed (RLS sees an
 *  unset GUC → zero rows). orgId is never caller-supplied — it comes from the verified principal. */
export async function withTenant<T>(orgId: string, fn: (tx: Tx) => Promise<T>): Promise<T> {
  if (!UUID_RE.test(orgId)) throw new Error('withTenant: orgId must be a uuid (got a non-uuid — refusing to set GUC)');
  return appDb.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.org_id', ${orgId}, true)`);
    return fn(tx as unknown as Tx);
  });
}

/** Enumerate every org and run `fn` inside withTenant for each — the cron helper. Uses the admin
 *  role ONLY to read the org list (cross-tenant), then drops to the app role + GUC per org so the
 *  work itself is RLS-respecting. (§4.3) Until identity-access's orgs table lands, the org list is
 *  the distinct set of org_ids seen across chassis tables; the real impl reads orgs. */
export async function forEachOrg<T>(fn: (orgId: string, tx: Tx) => Promise<T>): Promise<T[]> {
  const rows = await adminDb().execute(
    sql`select distinct org_id from sync_exceptions union select distinct org_id from idempotency_keys`,
  );
  const out: T[] = [];
  for (const r of rows as unknown as Array<{ org_id: string }>) {
    out.push(await withTenant(r.org_id, (tx) => fn(r.org_id, tx)));
  }
  return out;
}
