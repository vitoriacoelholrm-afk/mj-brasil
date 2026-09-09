// drift-check.mjs — verify no installed module cell has been hand-edited (managed cells are
// catalog-owned; a local edit "drift-ejects" the file and must be surfaced, not silently kept).
// Recomputes the sha256/16 the `astralitics` CLI records in modules.lock.json and compares.
// Real implementation (the chassis-template previously shipped only a package.json script, no file — G15.5).
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const lockPath = join(root, '.astralitics/modules.lock.json');

const sha = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 16);

if (!existsSync(lockPath)) {
  console.log('drift:check — no modules.lock.json; nothing installed.');
  process.exit(0);
}

const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
const drifted = [];
const missing = [];
let checked = 0;

for (const [mod, info] of Object.entries(lock.modules ?? {})) {
  for (const [rel, expected] of Object.entries(info.files ?? {})) {
    // modules.lock.json already records each file's full path relative to the app root (not just
    // the UI cell folder) — e.g. `packages\db\src\entities\Asset.ts`, not just a modules/<mod>/ path.
    const p = join(root, rel);
    if (!existsSync(p)) { missing.push(`${mod}/${rel}`); continue; }
    checked++;
    const actual = sha(readFileSync(p));
    if (actual !== expected) drifted.push(`${mod}/${rel} (lock ${expected} → file ${actual})`);
  }
}

if (drifted.length || missing.length) {
  if (drifted.length) console.error('✗ drift:check — hand-edited managed cells (eject or propose a catalog change):\n  ' + drifted.join('\n  '));
  if (missing.length) console.error('✗ drift:check — installed files missing from disk:\n  ' + missing.join('\n  '));
  process.exit(1);
}
console.log(`✓ drift:check — ${checked} installed cell file(s) match the lock; no drift.`);
