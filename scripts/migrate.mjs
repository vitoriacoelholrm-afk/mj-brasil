// migrate.mjs — apply pending SQL migrations as the admin role (postgres, BYPASSRLS, session
// pooler). Tracks applied files in _migrations. Each file runs in its own transaction.
// The Beamy vercel-migrate pattern, simplified; deploy wraps this to run prod-only (§1.5).
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import postgres from 'postgres';
import { loadEnv, ROOT } from './_env.mjs';

loadEnv();
const sslFor = (u) => (/@(localhost|127\.|\[::1\])/.test(u) ? false : 'require');

const MIG = join(ROOT, 'packages/db/migrations');
const url = process.env.DATABASE_URL_ADMIN;
if (!url) throw new Error('DATABASE_URL_ADMIN not set');
const appPw = process.env.APP_DB_PASSWORD;

const sql = postgres(url, { prepare: false, max: 1, ssl: sslFor(url), onnotice: () => {} });

function substitute(text) {
  // psql-style :'app_pw' -> a safe single-quoted literal (format(%L) double-protects).
  if (text.includes(":'app_pw'")) {
    if (!appPw) throw new Error('migration needs APP_DB_PASSWORD');
    return text.replaceAll(":'app_pw'", `'${appPw.replaceAll("'", "''")}'`);
  }
  return text;
}

try {
  await sql`create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())`;
  const applied = new Set((await sql`select name from _migrations`).map((r) => r.name));
  const files = readdirSync(MIG).filter((f) => f.endsWith('.sql')).sort();
  let n = 0;
  for (const f of files) {
    if (applied.has(f)) { console.log(`  · ${f} (already applied)`); continue; }
    const text = substitute(readFileSync(join(MIG, f), 'utf8'));
    process.stdout.write(`  → ${f} … `);
    await sql.begin(async (tx) => {
      await tx.unsafe(text);
      await tx`insert into _migrations (name) values (${f})`;
    });
    console.log('applied ✓');
    n++;
  }
  console.log(n ? `\n${n} migration(s) applied.` : '\nUp to date.');
} catch (e) {
  console.error('\n✗ migration failed:', e.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
