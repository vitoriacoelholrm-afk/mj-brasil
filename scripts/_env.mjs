// Minimal .env.local loader (no dependency) — loads gitignored secrets into process.env for
// scripts. Vercel injects these as real env vars in CI/deploy; this is local-only.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

export function loadEnv() {
  const p = join(root, '.env.local');
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    const k = t.slice(0, i);
    if (!(k in process.env)) process.env[k] = t.slice(i + 1);
  }
}

export const ROOT = root;
