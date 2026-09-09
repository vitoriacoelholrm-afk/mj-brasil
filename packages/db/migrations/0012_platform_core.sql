-- 0001_platform_core.sql — GENERATED from platform-core's entity Drizzle by
-- catalog-tooling migration-gen (architecture-feedback G17). Do not hand-edit; re-run
-- `pnpm astralitics gen-migration platform-core`. Additive-only (ADR-06); the RLS appendix is
-- auto-emitted on every org_id table (check:rls). mj_brasil_app is filled per install.

create extension if not exists pgcrypto;
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default nullif(current_setting('app.org_id', true), '')::uuid,
  name text not null,
  storage_key text not null,
  content_type text,
  category text,
  owner_type text,
  owner_id text,
  tags jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  created_by text,
  updated_by text
);
create index if not exists documents_org_idx on documents (org_id);
alter table documents enable row level security;
alter table documents force row level security;
drop policy if exists documents_tenant_isolation on documents;
create policy documents_tenant_isolation on documents
  using      (org_id = nullif(current_setting('app.org_id', true), '')::uuid)
  with check (org_id = nullif(current_setting('app.org_id', true), '')::uuid);
grant select, insert, update, delete on documents to mj_brasil_app;

create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default nullif(current_setting('app.org_id', true), '')::uuid,
  at timestamp with time zone not null default now(),
  actor text not null,
  action text not null,
  owner_type text,
  owner_id text,
  summary text,
  data jsonb
);
create index if not exists audit_events_org_idx on audit_events (org_id);
alter table audit_events enable row level security;
alter table audit_events force row level security;
drop policy if exists audit_events_tenant_isolation on audit_events;
create policy audit_events_tenant_isolation on audit_events
  using      (org_id = nullif(current_setting('app.org_id', true), '')::uuid)
  with check (org_id = nullif(current_setting('app.org_id', true), '')::uuid);
grant select, insert, update, delete on audit_events to mj_brasil_app;

create table if not exists notification_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default nullif(current_setting('app.org_id', true), '')::uuid,
  template_key text not null,
  channel text not null,
  recipient text not null,
  status text not null default 'queued',
  sent_at timestamp with time zone,
  error text
);
create index if not exists notification_logs_org_idx on notification_logs (org_id);
alter table notification_logs enable row level security;
alter table notification_logs force row level security;
drop policy if exists notification_logs_tenant_isolation on notification_logs;
create policy notification_logs_tenant_isolation on notification_logs
  using      (org_id = nullif(current_setting('app.org_id', true), '')::uuid)
  with check (org_id = nullif(current_setting('app.org_id', true), '')::uuid);
grant select, insert, update, delete on notification_logs to mj_brasil_app;

create table if not exists notification_templates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default nullif(current_setting('app.org_id', true), '')::uuid,
  key text not null,
  channel text not null default 'email',
  subject text,
  body text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  created_by text,
  updated_by text
);
create index if not exists notification_templates_org_idx on notification_templates (org_id);
alter table notification_templates enable row level security;
alter table notification_templates force row level security;
drop policy if exists notification_templates_tenant_isolation on notification_templates;
create policy notification_templates_tenant_isolation on notification_templates
  using      (org_id = nullif(current_setting('app.org_id', true), '')::uuid)
  with check (org_id = nullif(current_setting('app.org_id', true), '')::uuid);
grant select, insert, update, delete on notification_templates to mj_brasil_app;
