import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

// Chassis-template test config. setupFiles loads gitignored local secrets so the DB-backed suites
// (tenancy/idempotency/request-path) can reach a dev DB locally; in CI these are real env vars
// (the Postgres service container) so the loader is a no-op. Suites self-gate on env via
// describe.skipIf, so `pnpm test` is green offline and exercises real behavior when env is present.
// The outbox suite (apps/web/src/chassis/outbox.test.ts) is pure (fake-indexeddb) and always runs.
//
// tsconfigPaths reads tsconfig.base.json's `paths` so an INSTALLED module's cells — which import
// `@astralitics/module-identity-access` / `@astralitics/definitions` / `@astralitics/entities` (the
// per-app aliases `astralitics install` wires there) — resolve at TEST runtime, exactly as they do at
// build/deploy (vite) and typecheck (tsc). Without it, an installed capability's catalog import fails
// only under vitest; the installed-smoke suite (and any app test that exercises an installed module)
// would be unrunnable. The spine suites import `@app/*` (real workspace packages) and don't need it.
export default defineConfig({
  plugins: [tsconfigPaths({ projects: ['./tsconfig.base.json'] })],
  test: {
    setupFiles: ['./scripts/vitest-setup.mjs'],
    include: ['packages/**/test/**/*.test.ts', 'apps/**/src/**/*.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    passWithNoTests: true,
  },
});
