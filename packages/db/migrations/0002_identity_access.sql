-- 0002_identity_access.sql — the minimal identity surface needed to resolve a request Context:
-- the Org tenant root + the login principal (Membership) + the RBAC quad. These entities are
-- OWNED BY identity-access (a catalog foundation module) and ship with the standard chassis spine
-- (the control-plane's per-module migration-gen, G17, will eventually emit this from the module's
-- entities). Additive-only (ADR-06); the RLS appendix is mandatory on every org_id table.

create extension if not exists pgcrypto;

-- ── orgs — THE tenant root (special: keyed on id = GUC, not org_id) ───────────────────────────
create table if not exists orgs (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null,
  name        text not null,
  settings    jsonb not null default '{}'::jsonb,
  is_primary  boolean not null default false,
  status      text not null default 'active',
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid,
  updated_by  uuid,
  constraint orgs_slug_uq unique (slug)
);
-- orgs has no org_id (it IS the tenant); its RLS keys on id = GUC so a tenant sees only its own org.
alter table orgs enable row level security;
alter table orgs force row level security;
drop policy if exists orgs_self_isolation on orgs;
create policy orgs_self_isolation on orgs
  using      (id = nullif(current_setting('app.org_id', true), '')::uuid)
  with check (id = nullif(current_setting('app.org_id', true), '')::uuid);
grant select, insert, update, delete on orgs to mj_brasil_app;

-- ── memberships — the unified login principal (person + membership + access tier) ─────────────
create table if not exists memberships (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null default nullif(current_setting('app.org_id', true), '')::uuid,
  auth_user_id  uuid,                       -- Supabase auth uid (null until activated / floor-only)
  display_name  text not null,
  email         text,
  rbac_role     text not null default 'employee',   -- admin | executive | employee
  pin_hash      text,                       -- floor identity (identity-access.hashPin)
  status        text not null default 'active',      -- active | invited | suspended
  invited_at    timestamptz,
  activated_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    uuid,
  updated_by    uuid
);
create index if not exists memberships_org_idx on memberships (org_id);
-- auth_user_id is looked up cross-org by resolveContext under the admin role (explicit filter),
-- so a partial unique index keeps one active membership per (org, auth user).
create unique index if not exists memberships_org_authuser_uq
  on memberships (org_id, auth_user_id) where auth_user_id is not null;
alter table memberships enable row level security;
alter table memberships force row level security;
drop policy if exists memberships_tenant_isolation on memberships;
create policy memberships_tenant_isolation on memberships
  using      (org_id = nullif(current_setting('app.org_id', true), '')::uuid)
  with check (org_id = nullif(current_setting('app.org_id', true), '')::uuid);
grant select, insert, update, delete on memberships to mj_brasil_app;

-- ── roles / permissions / role_permissions / role_assignments — the RBAC quad ─────────────────
create table if not exists roles (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null default nullif(current_setting('app.org_id', true), '')::uuid,
  name        text not null,            -- org-defined role name (e.g. supervisor, manager)
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid,
  updated_by  uuid,
  constraint roles_org_name_uq unique (org_id, name)
);
create index if not exists roles_org_idx on roles (org_id);
alter table roles enable row level security;
alter table roles force row level security;
drop policy if exists roles_tenant_isolation on roles;
create policy roles_tenant_isolation on roles
  using      (org_id = nullif(current_setting('app.org_id', true), '')::uuid)
  with check (org_id = nullif(current_setting('app.org_id', true), '')::uuid);
grant select, insert, update, delete on roles to mj_brasil_app;

create table if not exists role_permissions (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null default nullif(current_setting('app.org_id', true), '')::uuid,
  role_id         uuid not null,             -- soft ref roles.id
  permission_key  text not null,             -- dotted capability key, e.g. 'chassis.sync.resolve'
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid,
  updated_by      uuid,
  constraint role_permissions_uq unique (org_id, role_id, permission_key)
);
create index if not exists role_permissions_org_idx on role_permissions (org_id);
alter table role_permissions enable row level security;
alter table role_permissions force row level security;
drop policy if exists role_permissions_tenant_isolation on role_permissions;
create policy role_permissions_tenant_isolation on role_permissions
  using      (org_id = nullif(current_setting('app.org_id', true), '')::uuid)
  with check (org_id = nullif(current_setting('app.org_id', true), '')::uuid);
grant select, insert, update, delete on role_permissions to mj_brasil_app;

create table if not exists role_assignments (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null default nullif(current_setting('app.org_id', true), '')::uuid,
  membership_id uuid not null,               -- soft ref memberships.id
  role_id       uuid not null,               -- soft ref roles.id
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    uuid,
  updated_by    uuid,
  constraint role_assignments_uq unique (org_id, membership_id, role_id)
);
create index if not exists role_assignments_org_idx on role_assignments (org_id);
alter table role_assignments enable row level security;
alter table role_assignments force row level security;
drop policy if exists role_assignments_tenant_isolation on role_assignments;
create policy role_assignments_tenant_isolation on role_assignments
  using      (org_id = nullif(current_setting('app.org_id', true), '')::uuid)
  with check (org_id = nullif(current_setting('app.org_id', true), '')::uuid);
grant select, insert, update, delete on role_assignments to mj_brasil_app;
