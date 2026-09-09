// check-procedures.mjs — static CI gate (APP_FACTORY.md §1.5). No domain/chassis router may build a
// route on publicProcedure; the public door is reserved for the public intake + auth endpoints (an
// allowlist). Pays down Rondo's "everything on publicProcedure" debt. Pure text scan.
//
// Template adaptation: the allowlist is the app-specific knob — read from app.config.json
// (`publicProcedureAllowlist`, default ['public-intake.ts', 'auth.ts']). Everything else is identical.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ROUTERS = join(ROOT, 'packages/trpc/src/routers');

function allowlist() {
  const cfg = join(ROOT, 'app.config.json');
  if (existsSync(cfg)) {
    const a = JSON.parse(readFileSync(cfg, 'utf8')).publicProcedureAllowlist;
    if (Array.isArray(a) && a.length) return new Set(a);
  }
  return new Set(['public-intake.ts', 'auth.ts']);
}

if (!existsSync(ROUTERS)) {
  console.log('check:procedures — no routers yet; nothing to scan.');
  process.exit(0);
}

const ALLOW = allowlist();
const problems = [];
for (const f of readdirSync(ROUTERS).filter((f) => f.endsWith('.ts'))) {
  if (ALLOW.has(f)) continue;
  const src = readFileSync(join(ROUTERS, f), 'utf8');
  // a route definition uses `publicProcedure.` (query/mutation/input) — flag it outside the allowlist
  if (/\bpublicProcedure\s*\.(input|query|mutation|use)\b/.test(src)) {
    problems.push(`${f}: uses publicProcedure for a route (only ${[...ALLOW].join(', ')} may; use orgScopedProcedure)`);
  }
}

if (problems.length) {
  console.error('✗ check:procedures failed —\n  ' + problems.join('\n  '));
  process.exit(1);
}
console.log('✓ check:procedures — no domain router on publicProcedure.');
