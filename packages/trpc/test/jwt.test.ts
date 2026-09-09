// G18 verification — real Supabase JWT verification + the HTTP entry, end-to-end against the live
// project. Mints a REAL access token (admin-create a confirmed user with the service-role key, then
// password sign-in), so jose verifies it against the project's published ES256 JWKS — proving the
// authenticated request path works over HTTP and that tampered tokens fail closed. Network-heavy;
// skips cleanly without the Supabase env. Cleans up the test user + rows afterward.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const SB = process.env.SUPABASE_URL;
const SROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON = process.env.SUPABASE_ANON_KEY;
const HAS = !!(SB && SROLE && ANON && process.env.DATABASE_URL_ADMIN);

const ORG = '00000000-0000-0000-0000-00000000c701';
const SLUG = 'test-jwt-org';
const EMAIL = 'mj-brasil-jwt-test@example.com';
const PW = 'Test-Passw0rd-9f3a';

async function sb(path: string, init: RequestInit & { service?: boolean } = {}) {
  const res = await fetch(`${SB}/auth/v1${path}`, {
    ...init,
    headers: { apikey: ANON!, Authorization: `Bearer ${init.service ? SROLE : ANON}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

describe.skipIf(!HAS)('JWT verification + HTTP entry (real Supabase)', () => {
  let createContext: typeof import('../src/context').createContext;
  let trpcFetchHandler: typeof import('../src/handler').trpcFetchHandler;
  let admin: any;
  let userId = '';
  let token = '';

  beforeAll(async () => {
    ({ createContext } = await import('../src/context'));
    ({ trpcFetchHandler } = await import('../src/handler'));
    const { _raw } = await import('@app/db');
    admin = _raw.adminSql();

    // best-effort cleanup of a prior run
    const list = await sb(`/admin/users?per_page=200`, { service: true });
    for (const u of (list.body.users ?? [])) if (u.email === EMAIL) await sb(`/admin/users/${u.id}`, { method: 'DELETE', service: true });

    const created = await sb(`/admin/users`, { method: 'POST', service: true, body: JSON.stringify({ email: EMAIL, password: PW, email_confirm: true }) });
    userId = created.body.id;
    const signin = await sb(`/token?grant_type=password`, { method: 'POST', body: JSON.stringify({ email: EMAIL, password: PW }) });
    token = signin.body.access_token;

    // seed an org + an admin membership for THIS real user's sub
    await admin`delete from sync_exceptions where org_id = ${ORG}`;
    await admin`delete from memberships where org_id = ${ORG}`;
    await admin`delete from orgs where slug = ${SLUG}`;
    await admin`insert into orgs (id, slug, name, is_primary) values (${ORG}, ${SLUG}, 'JWT Org', true)`;
    await admin`insert into memberships (org_id, auth_user_id, display_name, rbac_role) values (${ORG}, ${userId}, 'JWT Admin', 'admin')`;
    await admin`insert into sync_exceptions (org_id, command_id, command_type, payload, client_ts, reason_code) values (${ORG}, gen_random_uuid(), 'test.jwt', '{}'::jsonb, now(), 'validation_failed')`;
  }, 30_000);

  afterAll(async () => {
    if (!admin) return;
    await admin`delete from sync_exceptions where org_id = ${ORG}`;
    await admin`delete from memberships where org_id = ${ORG}`;
    await admin`delete from orgs where slug = ${SLUG}`;
    if (userId) await sb(`/admin/users/${userId}`, { method: 'DELETE', service: true });
  });

  it('a real Supabase token is verified against the JWKS and yields its sub', async () => {
    expect(token).toBeTruthy();
    const ctx = await createContext({ headers: { authorization: `Bearer ${token}` } });
    expect(ctx.auth?.authUserId).toBe(userId);
  });

  it('a tampered token fails closed (no session)', async () => {
    const tampered = token.slice(0, -3) + 'AAA';
    const ctx = await createContext({ headers: { authorization: `Bearer ${tampered}` } });
    expect(ctx.auth).toBeNull();
    const garbage = await createContext({ headers: { authorization: 'Bearer not.a.jwt' } });
    expect(garbage.auth).toBeNull();
  });

  it('HTTP entry: an authenticated GET reaches the RLS-scoped query (200, only this org)', async () => {
    const input = encodeURIComponent(JSON.stringify({ limit: 50 }));
    const req = new Request(`https://x/api/trpc/chassis.listSyncExceptions?input=${input}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    const res = await trpcFetchHandler(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    const items = body?.result?.data?.items ?? [];
    expect(items.length).toBe(1); // only this org's row, through real JWT + RLS
  });

  it('HTTP entry: an unauthenticated request is rejected (401)', async () => {
    const input = encodeURIComponent(JSON.stringify({ limit: 50 }));
    const req = new Request(`https://x/api/trpc/chassis.listSyncExceptions?input=${input}`);
    const res = await trpcFetchHandler(req);
    expect(res.status).toBe(401);
  });
});
