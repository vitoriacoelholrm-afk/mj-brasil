-- 0000_roles.sql — the two-role tenancy foundation (the standard chassis; ADR-15, architecture-
-- feedback G16). Runs once per project, as the admin (a BYPASSRLS superowner).
--
-- The admin role is the platform's built-in BYPASSRLS superowner — on Supabase that is the built-in
-- `postgres` role, and on a plain Postgres (CI service container) likewise `postgres`. So we DO NOT
-- create a second admin role; that superowner IS the admin connection (DATABASE_URL_ADMIN). We DO
-- create the runtime app role (mj_brasil_app, filled to <slug>_app by `astralitics create-app`): a LOGIN
-- NOBYPASSRLS role that routes cleanly through Supavisor's transaction-mode pooler. This is the
-- documented deviation from the spec's literal two-NEW-roles wording (proven on real Supabase, G16).
--
-- The password is injected by the migrate runner from APP_DB_PASSWORD (never committed).

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'mj_brasil_app') then
    execute format('create role mj_brasil_app login noinherit nobypassrls password %L', :'app_pw');
  else
    execute format('alter role mj_brasil_app login noinherit nobypassrls password %L', :'app_pw');
  end if;
end $$;

grant usage on schema public to mj_brasil_app;
-- Future tables get DML grants in their own migration's RLS appendix. Make new postgres-owned
-- tables grant to mj_brasil_app by default so an author can't forget:
alter default privileges for role postgres in schema public
  grant select, insert, update, delete on tables to mj_brasil_app;
