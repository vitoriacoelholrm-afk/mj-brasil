-- 0001_customer_management.sql — GENERATED from customer-management's entity Drizzle by
-- catalog-tooling migration-gen (architecture-feedback G17). Do not hand-edit; re-run
-- `pnpm astralitics gen-migration customer-management`. Additive-only (ADR-06); the RLS appendix is
-- auto-emitted on every org_id table (check:rls). mj_brasil_app is filled per install.

create extension if not exists pgcrypto;
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default nullif(current_setting('app.org_id', true), '')::uuid,
  type text not null default 'commercial',
  name text not null,
  display_name text,
  tax_id text,
  email text,
  phone text,
  billing_address jsonb,
  payment_terms_days integer not null default 30,
  status text not null default 'active',
  notes text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  created_by text,
  updated_by text
);
create index if not exists customers_org_idx on customers (org_id);
alter table customers enable row level security;
alter table customers force row level security;
drop policy if exists customers_tenant_isolation on customers;
create policy customers_tenant_isolation on customers
  using      (org_id = nullif(current_setting('app.org_id', true), '')::uuid)
  with check (org_id = nullif(current_setting('app.org_id', true), '')::uuid);
grant select, insert, update, delete on customers to mj_brasil_app;
