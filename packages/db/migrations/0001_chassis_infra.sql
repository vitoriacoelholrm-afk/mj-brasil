-- 0001_chassis_infra.sql — the chassis infrastructure tables + the MANDATORY RLS appendix.
-- Every table with org_id carries: enable + FORCE rls + a tenant_isolation policy keyed on the
-- GUC, plus DML grants to mj_brasil_app. The RLS appendix is required on EVERY such migration
-- (check:rls scans for its absence). Lesson: PETfactory security_advisor_fixes. (§1.2)

create extension if not exists pgcrypto; -- gen_random_uuid()

-- ── sync_exceptions ─────────────────────────────────────────────────────────────────────────
create table if not exists sync_exceptions (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null default nullif(current_setting('app.org_id', true), '')::uuid,
  command_id      uuid not null,
  command_type    text not null,
  payload         jsonb not null,
  membership_id   uuid,
  client_ts       timestamptz not null,
  entity_ref      jsonb,
  reason_code     text not null,
  reason_detail   text,
  status          text not null default 'open',
  resolution_note text,
  resolved_by     uuid,
  resolved_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid,
  updated_by      uuid,
  constraint sync_exceptions_org_command_uq unique (org_id, command_id)
);
create index if not exists sync_exceptions_org_idx on sync_exceptions (org_id);

-- RLS appendix (mandatory)
alter table sync_exceptions enable row level security;
alter table sync_exceptions force row level security;
drop policy if exists sync_exceptions_tenant_isolation on sync_exceptions;
create policy sync_exceptions_tenant_isolation on sync_exceptions
  using      (org_id = nullif(current_setting('app.org_id', true), '')::uuid)
  with check (org_id = nullif(current_setting('app.org_id', true), '')::uuid);
grant select, insert, update, delete on sync_exceptions to mj_brasil_app;

-- ── idempotency_keys ────────────────────────────────────────────────────────────────────────
create table if not exists idempotency_keys (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null default nullif(current_setting('app.org_id', true), '')::uuid,
  key           uuid not null,
  command_type  text not null,
  request_hash  text not null,
  status        text not null default 'in_flight',
  response      jsonb,
  first_seen_at timestamptz not null default now(),
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    uuid,
  updated_by    uuid,
  constraint idempotency_keys_org_key_uq unique (org_id, key)
);
create index if not exists idempotency_keys_org_idx on idempotency_keys (org_id);

-- RLS appendix (mandatory)
alter table idempotency_keys enable row level security;
alter table idempotency_keys force row level security;
drop policy if exists idempotency_keys_tenant_isolation on idempotency_keys;
create policy idempotency_keys_tenant_isolation on idempotency_keys
  using      (org_id = nullif(current_setting('app.org_id', true), '')::uuid)
  with check (org_id = nullif(current_setting('app.org_id', true), '')::uuid);
grant select, insert, update, delete on idempotency_keys to mj_brasil_app;
