// End-to-end request-path proof (_chassis.md §1.5). Exercises the FULL stack against real Postgres:
// createContext → protectedProcedure → orgScopedProcedure (resolveContext + withTenant) →
// capability (can() + RLS-scoped query). Proves auth, the permission gate, AND tenant isolation
// reach all the way through tRPC — not just at the DB layer.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const HAS_DB = !!process.env.DATABASE_URL && !!process.env.DATABASE_URL_ADMIN;

const ORG_A = '00000000-0000-0000-0000-0000000a0001';
const ORG_B = '00000000-0000-0000-0000-0000000b0001';
const AUTH_ADMIN = '00000000-0000-0000-0000-00000000ad01';
const AUTH_EMP = '00000000-0000-0000-0000-0000000e3301';
const SLUG_A = 'test-trpc-a';
const SLUG_B = 'test-trpc-b';

// This suite tests the ladder/RLS/permission path, so it builds RequestContext DIRECTLY (the
// principal as if already verified) — JWT verification is covered separately in jwt.test.ts.
const asAuth = (authUserId: string | null) => ({ auth: authUserId ? { authUserId, membershipId: null } : null, activeOrgId: null });

describe.skipIf(!HAS_DB)('request path (real Postgres, full tRPC stack)', () => {
  let appRouter: typeof import('../src/routers').appRouter;
  let admin: any;

  beforeAll(async () => {
    ({ appRouter } = await import('../src/routers'));
    const { _raw } = await import('@app/db');
    admin = _raw.adminSql();
    // clean + seed (admin bypasses RLS)
    await admin`delete from sync_exceptions where command_type = 'test.reqpath'`;
    await admin`delete from role_assignments where org_id in (${ORG_A}, ${ORG_B})`;
    await admin`delete from memberships where org_id in (${ORG_A}, ${ORG_B})`;
    await admin`delete from orgs where slug in (${SLUG_A}, ${SLUG_B})`;
    await admin`insert into orgs (id, slug, name, is_primary) values (${ORG_A}, ${SLUG_A}, 'Org A', true), (${ORG_B}, ${SLUG_B}, 'Org B', false)`;
    await admin`insert into memberships (org_id, auth_user_id, display_name, rbac_role) values
      (${ORG_A}, ${AUTH_ADMIN}, 'Admin A', 'admin'),
      (${ORG_A}, ${AUTH_EMP}, 'Emp A', 'employee')`;
    // one sync_exception per org
    for (const org of [ORG_A, ORG_B]) {
      await admin`insert into sync_exceptions (org_id, command_id, command_type, payload, client_ts, reason_code)
                  values (${org}, gen_random_uuid(), 'test.reqpath', '{}'::jsonb, now(), 'validation_failed')`;
    }
  });

  afterAll(async () => {
    if (!admin) return;
    await admin`delete from sync_exceptions where command_type = 'test.reqpath'`;
    await admin`delete from memberships where org_id in (${ORG_A}, ${ORG_B})`;
    await admin`delete from orgs where slug in (${SLUG_A}, ${SLUG_B})`;
  });

  it('admin (bearer JWT) lists only their org and can resolve — full path works + RLS isolates', async () => {
    const caller = appRouter.createCaller(asAuth(AUTH_ADMIN));
    const { items } = await caller.chassis.listSyncExceptions({ limit: 50 });
    expect(items.length).toBe(1); // org A's row only — org B's never visible through the stack
    const resolved = await caller.chassis.resolveSyncException({ id: items[0].id as string, resolution: 'resolved', note: 'ok' });
    expect((resolved as any).status).toBe('resolved');
    // resolving again is an invalid transition (already terminal)
    await expect(caller.chassis.resolveSyncException({ id: items[0].id as string, resolution: 'resolved' })).rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it('employee is blocked by the capability permission gate (FORBIDDEN)', async () => {
    const caller = appRouter.createCaller(asAuth(AUTH_EMP));
    await expect(caller.chassis.listSyncExceptions({ limit: 50 })).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('no session is UNAUTHORIZED at protectedProcedure', async () => {
    const caller = appRouter.createCaller(asAuth(null));
    await expect(caller.chassis.listSyncExceptions({ limit: 50 })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('an unknown auth user resolves to no membership (FORBIDDEN)', async () => {
    const caller = appRouter.createCaller(asAuth('00000000-0000-0000-0000-0000ffffffff'));
    await expect(caller.chassis.listSyncExceptions({ limit: 50 })).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
});
