// check-rls.mjs — static CI gate (APP_FACTORY.md §1.5 / architecture-feedback G16). Scans every
// migration: any `create table <t>` that has an `org_id` column MUST, in the same file, also enable
// + force RLS and create a policy on <t>, and grant DML to the app role. Catches the migration that
// forgot its RLS appendix (the PETfactory security_advisor lesson) BEFORE it reaches a database.
// Pure text scan — no DB needed.
//
// Template adaptation: the app role is the one app-specific knob (copafix used `copafix_app`). It is
// read from app.config.json (`appRole`, e.g. `<slug>_app`, filled by `astralitics create-app`); falls
// back to `app` if unset. Everything else is identical to the source gate.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIG = join(ROOT, 'packages/db/migrations');

function appRole() {
  const cfg = join(ROOT, 'app.config.json');
  if (existsSync(cfg)) {
    const r = JSON.parse(readFileSync(cfg, 'utf8')).appRole;
    if (r && !r.includes('__')) return String(r).toLowerCase(); // ignore an unfilled mj_brasil_app placeholder
  }
  return 'app';
}

if (!existsSync(MIG)) {
  console.log('check:rls — no migrations dir yet; nothing to scan.');
  process.exit(0);
}

const ROLE = appRole();
const files = readdirSync(MIG).filter((f) => f.endsWith('.sql')).sort();

const problems = [];
for (const f of files) {
  const sql = readFileSync(join(MIG, f), 'utf8').toLowerCase();
  // crude but effective: find each `create table [if not exists] <name> (` then check the column
  // list contains org_id; if so, require the RLS appendix statements for that table in the file.
  const re = /create table(?:\s+if not exists)?\s+([a-z0-9_]+)\s*\(([\s\S]*?)\n\);/g;
  let m;
  while ((m = re.exec(sql))) {
    const [, table, body] = m;
    if (!/\borg_id\b/.test(body)) continue;
    const need = [
      [`enable row level security on ${table}`, new RegExp(`alter table ${table} enable row level security`)],
      [`force row level security on ${table}`, new RegExp(`alter table ${table} force row level security`)],
      [`tenant policy on ${table}`, new RegExp(`create policy [a-z0-9_]+ on ${table}`)],
      [`grant DML to ${ROLE} on ${table}`, new RegExp(`grant[^;]*on ${table} to ${ROLE}`)],
    ];
    for (const [label, rx] of need) if (!rx.test(sql)) problems.push(`${f}: table '${table}' has org_id but is missing: ${label}`);
  }
}

if (problems.length) {
  console.error('✗ check:rls failed —\n  ' + problems.join('\n  '));
  process.exit(1);
}
console.log(`✓ check:rls — ${files.length} migration(s) scanned, every org_id table has its RLS appendix (role: ${ROLE}).`);
