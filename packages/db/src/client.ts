// The two DB clients (spec _chassis.md §1.2). The runtime path uses appDb ONLY (mj_brasil_app,
// NOBYPASSRLS) — RLS is live on every query. adminDb (BYPASSRLS) is reserved for migrations,
// the cron forEachOrg enumeration, and nothing else. Keeping them as two separate roles is the
// whole point: with a single postgres connection (which has BYPASSRLS) RLS would be silently off.
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as chassis from './chassis/schema.js';

const schema = { ...chassis };

function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name} — see _chassis.md §1.6 (Connections)`);
  return v;
}

// TLS for cloud Supabase; disabled for a local Postgres (CI service container, supabase start).
const sslFor = (url: string): 'require' | false => (/@(localhost|127\.|\[::1\])/.test(url) ? false : 'require');

// Runtime role: mj_brasil_app via the transaction-mode pooler (Supavisor 6543).
// prepare:false is mandatory on the transaction pooler (no session-level prepared statements).
const appUrl = need('DATABASE_URL');
const appSql = postgres(appUrl, {
  prepare: false,
  max: Number(process.env.DB_POOL_MAX ?? 10),
  ssl: sslFor(appUrl),
});

// Admin role: postgres (Supabase's BYPASSRLS owner) via the session-mode pooler (5432).
// Lazily built so a runtime process that never migrates needn't hold the admin credential.
let _adminSql: ReturnType<typeof postgres> | null = null;
function adminSql() {
  if (!_adminSql) {
    const url = need('DATABASE_URL_ADMIN');
    _adminSql = postgres(url, { prepare: false, max: 2, ssl: sslFor(url) });
  }
  return _adminSql;
}

export const appDb = drizzle(appSql, { schema });
export const adminDb = () => drizzle(adminSql(), { schema });

export const _raw = { appSql, adminSql };
export { schema };
