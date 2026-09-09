// Installed-module smoke (the install→boot proof). Where request-path.test.ts proves the SPINE
// (chassis/identity) end-to-end, this proves an INSTALLED catalog module's cells actually run: a
// freshly created app that installed budget-control can, through the full tRPC stack
// (createCaller → protectedProcedure → orgScopedProcedure → withTenant → capability), round-trip a
// cost center against a real migrated Postgres — and RLS isolates it from another org.
//
// Self-gates twice: skips with no DB (so `pnpm test` is green offline), AND skips when budget-control
// isn't installed (the bare chassis, or an app without it) — detected by the presence of the mounted
// router cell, a collection-time check that avoids importing the DB-eager appRouter before HAS_DB.
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const HAS_DB = !!process.env.DATABASE_URL && !!process.env.DATABASE_URL_ADMIN;
const here = dirname(fileURLToPath(import.meta.url));
// budget-control's router cell is placed here by `astralitics install budget-control`.
const BUDGET_INSTALLED = existsSync(join(here, '..', 'src', 'routers', 'budget-control.ts'));

const ORG_A = '00000000-0000-0000-0000-00000e2e0a01';
const ORG_B = '00000000-0000-0000-0000-00000e2e0b01';
const AUTH_A = '00000000-0000-0000-0000-00000e2ead01';
const AUTH_B = '00000000-0000-0000-0000-00000e2ead02';
const SLUG_A = 'e2e-smoke-a';
const SLUG_B = 'e2e-smoke-b';
const asAuth = (authUserId: string | null) => ({ auth: authUserId ? { authUserId, membershipId: null } : null, activeOrgId: null });

describe.skipIf(!HAS_DB || !BUDGET_INSTALLED)('installed module smoke — budget-control (real Postgres)', () => {
  let appRouter: any;
  let admin: any;

  beforeAll(async () => {
    ({ appRouter } = await import('../src/routers'));
    const { _raw } = await import('@app/db');
    admin = _raw.adminSql();
    // clean + seed two orgs, each with an admin membership (admin bypasses RLS)
    await admin`delete from cost_centers where org_id in (${ORG_A}, ${ORG_B})`;
    await admin`delete from memberships where org_id in (${ORG_A}, ${ORG_B})`;
    await admin`delete from orgs where slug in (${SLUG_A}, ${SLUG_B})`;
    await admin`insert into orgs (id, slug, name, is_primary) values (${ORG_A}, ${SLUG_A}, 'E2E A', true), (${ORG_B}, ${SLUG_B}, 'E2E B', false)`;
    await admin`insert into memberships (org_id, auth_user_id, display_name, rbac_role) values
      (${ORG_A}, ${AUTH_A}, 'E2E Admin A', 'admin'),
      (${ORG_B}, ${AUTH_B}, 'E2E Admin B', 'admin')`;
  });

  afterAll(async () => {
    if (!admin) return;
    await admin`delete from cost_centers where org_id in (${ORG_A}, ${ORG_B})`;
    await admin`delete from memberships where org_id in (${ORG_A}, ${ORG_B})`;
    await admin`delete from orgs where slug in (${SLUG_A}, ${SLUG_B})`;
  });

  it('an installed module round-trips a cost center through the full tRPC stack, RLS-isolated', async () => {
    const callerA = appRouter.createCaller(asAuth(AUTH_A));
    // WRITE via the installed budget-control capability (gated by can() — admin passes)
    const created = await callerA['budget-control'].upsertCostCenter({ code: 'E2E-A', name: 'E2E Center A' });
    expect(created).toBeTruthy();
    // READ it back (RLS-scoped to org A)
    const listA = await callerA['budget-control'].listCostCenters();
    expect((listA as Array<{ code: string }>).some((c) => c.code === 'E2E-A')).toBe(true);
    // RLS through the full stack: org B never sees org A's cost center
    const callerB = appRouter.createCaller(asAuth(AUTH_B));
    const listB = await callerB['budget-control'].listCostCenters();
    expect((listB as Array<{ code: string }>).some((c) => c.code === 'E2E-A')).toBe(false);
  });
});
