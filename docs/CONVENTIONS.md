# Conventions
- Entities: PascalCase. Modules: kebab-case. Disambiguate generics (AIAgent, not Agent).
- Module code: apps/web/src/modules/<name>/. App-local: apps/web/src/app-local/.
- Capabilities: pure (db, ctx, input) functions. Tools = MCP facets on capabilities.
- English for universal concerns; Spanish for MX-specific domains (facturacion, contaduria, fiscal-cfdi).

## Deploy recipe (Vercel + pnpm-workspace serverless functions) — architecture-feedback G22
- **ESM `.js` extensions on every relative import** in `packages/{db,trpc}`. Vercel's `@vercel/node`
  compiles workspace TS with `node16`/`nodenext` resolution, which requires explicit `.js` on
  relative imports/exports (and `/index.js` for directory imports). Valid under Vite/vitest too.
- **Pre-bundle the API handler.** `@vercel/nft` can't trace pnpm-symlinked workspace packages, so
  `scripts/build-api.mjs` (esbuild) bundles `@app/trpc` + `@app/db` into a self-contained
  `api/_handler.js` (node built-ins external). The Vercel function (`api/trpc/[trpc].ts`) imports
  that one local file. `api/_handler.js` is generated — keep it gitignored. `vercel.json`'s
  `buildCommand` runs `build-api.mjs` before the web build.
- `vercel.json` uses `framework: vite`, `installCommand: pnpm install --frozen-lockfile=false`, and
  an SPA-fallback rewrite (`/((?!api/).*) → /index.html`) so deep links serve `index.html` while
  `/api/*` reaches the function. Pin a known-good `pnpm` (≥9.15.1) — earlier 9.x hits a Vercel
  build-image bug (G15.3).

## CI gates (static, no DB) — architecture-feedback G15 / G16
Wired in `.github/workflows/ci.yml`; run them locally with `pnpm check:rls`, `pnpm check:procedures`,
`pnpm drift:check`.
- **`check:rls`** — every migration `create table` with an `org_id` column must also enable+force RLS,
  create a tenant policy, and grant DML to the app role (read from `app.config.json` → `appRole`).
- **`check:procedures`** — no router builds a route on `publicProcedure` except the allowlist
  (`app.config.json` → `publicProcedureAllowlist`, default public-intake + auth).
- **`drift:check`** — no installed module cell has been hand-edited (sha vs `modules.lock.json`).
