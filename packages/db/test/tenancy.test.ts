// The mandatory tenancy suite (_chassis.md §1.2) as a vitest test for CI. Imports the REAL
// withTenant chokepoint. Skips cleanly when no DB is configured so `pnpm test` is safe anywhere;
// in CI a Postgres service container (with the two roles) provides DATABASE_URL/_ADMIN.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const HAS_DB = !!process.env.DATABASE_URL && !!process.env.DATABASE_URL_ADMIN;
const A = '00000000-0000-0000-0000-0000000000aa';
const B = '00000000-0000-0000-0000-0000000000bb';
const TYPE = 'test.tenancy.vitest';

describe.skipIf(!HAS_DB)('tenancy spine (real Postgres)', () => {
  let withTenant: typeof import('../src/chassis/withTenant').withTenant;
  let admin: any;
  let appRaw: any;
  let sql: any;

  beforeAll(async () => {
    ({ withTenant } = await import('../src/chassis/withTenant'));
    const { _raw } = await import('../src/client');
    appRaw = _raw.appSql;
    admin = _raw.adminSql();
    ({ sql } = await import('drizzle-orm'));
    await admin`delete from sync_exceptions where command_type = ${TYPE}`;
    for (const org of [A, B]) {
      await withTenant(org, (tx) =>
        tx.execute(sql`insert into sync_exceptions (command_id, command_type, payload, client_ts, reason_code)
          values (gen_random_uuid(), ${TYPE}, '{}'::jsonb, now(), 'validation_failed')`));
    }
  });

  afterAll(async () => {
    if (admin) await admin`delete from sync_exceptions where command_type = ${TYPE}`;
  });

  it('crud-isolation: A sees/writes only A; cross-org and forged inserts blocked', async () => {
    const seen = await withTenant(A, (tx) => tx.execute(sql`select org_id from sync_exceptions where command_type = ${TYPE}`));
    expect(seen.length).toBe(1);
    expect((seen[0] as any).org_id).toBe(A);
    const cross = await withTenant(A, (tx) => tx.execute(sql`update sync_exceptions set reason_detail='y' where org_id = ${B}`));
    expect((cross as any).count ?? (cross as any).rowCount ?? 0).toBe(0);
    await expect(
      withTenant(A, (tx) => tx.execute(sql`insert into sync_exceptions (org_id, command_id, command_type, payload, client_ts, reason_code)
        values (${B}, gen_random_uuid(), ${TYPE}, '{}'::jsonb, now(), 'validation_failed')`)),
    ).rejects.toBeTruthy();
  });

  it('unset-guc: bare app connection sees zero rows and cannot insert', async () => {
    const rows = await appRaw`select * from sync_exceptions where command_type = ${TYPE}`;
    expect(rows.length).toBe(0);
    await expect(
      appRaw`insert into sync_exceptions (command_id, command_type, payload, client_ts, reason_code)
             values (gen_random_uuid(), ${TYPE}, '{}'::jsonb, now(), 'validation_failed')`,
    ).rejects.toBeTruthy();
  });

  it('pooler-reuse: transaction-local GUC evaporates; next tenant sees no residue', async () => {
    await withTenant(A, (tx) => tx.execute(sql`select 1`));
    const afterA = await appRaw`select current_setting('app.org_id', true) as guc`;
    expect(afterA[0].guc == null || afterA[0].guc === '').toBe(true);
    const seenByB = await withTenant(B, (tx) => tx.execute(sql`select org_id from sync_exceptions where command_type = ${TYPE}`));
    expect((seenByB as any[]).every((r) => r.org_id === B)).toBe(true);
  });

  it('rls-coverage: every org_id table is enabled + forced + has a policy', async () => {
    const gaps = await admin`
      select c.relname from pg_class c
      join pg_namespace n on n.oid = c.relnamespace and n.nspname='public'
      where c.relkind='r'
        and exists (select 1 from information_schema.columns col where col.table_schema='public' and col.table_name=c.relname and col.column_name='org_id')
        and not (c.relrowsecurity and c.relforcerowsecurity and (select count(*) from pg_policies p where p.tablename=c.relname and p.schemaname='public')>0)`;
    expect(gaps.length).toBe(0);
  });

  it('runtime-role-honesty: the request-path role does not bypass RLS', async () => {
    const who = await appRaw`select current_user as u`;
    expect(who[0].u).toBe('mj_brasil_app');
    const r = await admin`select rolbypassrls from pg_roles where rolname = ${who[0].u}`;
    expect(r[0].rolbypassrls).toBe(false);
  });
});
