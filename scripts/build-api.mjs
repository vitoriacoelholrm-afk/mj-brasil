// build-api.mjs — bundle the tRPC handler into a self-contained ESM file for the Vercel function.
// @vercel/nft can't trace pnpm-symlinked workspace packages, so we pre-bundle everything (workspace
// TS + node_modules) into api/_handler.js; node built-ins stay external. The function then imports
// one local JS file with zero bare-package dependencies to resolve at runtime. (architecture-feedback G22.)
//
// Template adaptation (chassis-template): the tRPC entry (packages/trpc/src/index.ts) ships with the
// chassis spine, which a freshly-scaffolded app may not have installed yet. So we no-op cleanly when
// the entry is absent — `vercel.json`'s buildCommand (`build-api && web build`) then succeeds on a
// spine-less scaffold, and starts emitting a real bundle the moment the spine lands. esbuild is
// imported dynamically AFTER that check, so a scaffold without an API needn't have esbuild installed.
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const entry = join(root, 'packages/trpc/src/index.ts');

if (!existsSync(entry)) {
  console.log(`build-api — no API entry at ${relative(root, entry)} (chassis spine not installed yet); skipping.`);
  process.exit(0);
}

const { build } = await import('esbuild');

await build({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outfile: join(root, 'api/_handler.js'),
  // CJS deps (postgres, drizzle) may reference require/__dirname under ESM — shim them.
  banner: { js: "import{createRequire}from'module';import{fileURLToPath}from'url';import{dirname}from'path';const require=createRequire(import.meta.url);const __filename=fileURLToPath(import.meta.url);const __dirname=dirname(__filename);" },
  logLevel: 'info',
});

console.log('✓ api/_handler.js bundled');
