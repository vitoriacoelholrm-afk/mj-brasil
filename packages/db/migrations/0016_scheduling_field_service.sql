-- 0001_scheduling_field_service.sql — THE shared field-work machine (spec §2): schedule_rules +
-- schedule_rule_items (the recurrence engine, ported from Rondo contracts/contract_items) + tasks
-- (the single execution machine, ported from service_visits) + task_assignments. Owned by the
-- scheduling-field-service catalog module. Back-ported from copafix (migrations/0007), renumbered to
-- the module-local 0001 (per the equipment-maintenance precedent; the global ordering is G17, separate).
-- RLS appendix mandatory on EVERY org_id table (enable+force+policy+grant; check:rls). The grant role
-- is the install-filled token mj_brasil_app (copafix's literal copafix_app, parameterized for the catalog).
-- Additive-only (ADR-06). The partial-unique indexes (schedule_rules_org_source_key_uq,
-- tasks_org_rule_item_due_uq, tasks_org_dedupe_uq, task_assignments_one_lead_uq,
-- task_assignments_one_member_uq) are LOAD-BEARING for capability concurrency/idempotency — this
-- migration is the source of truth for the WHERE-clause partials (drizzle's unique() can't express them).

create extension if not exists pgcrypto;

-- ── schedule_rules — the recurrence rule ──────────────────────────────────────────────────────
create table if not exists schedule_rules (
  id                        uuid primary key default gen_random_uuid(),
  org_id                    uuid not null default nullif(current_setting('app.org_id', true), '')::uuid,
  name                      text not null,
  description               text,
  kind                      text not null,                  -- Definition task_kind
  schedule_mode             text not null default 'fixed',  -- Definition schedule_mode
  default_frequency_days    int not null default 30,
  lead_time_days            int not null default 14,
  grace_days                int not null default 2,
  duplicate_suppression     text not null default 'while_open',
  auto_schedule             boolean not null default false,
  seasonal_windows          jsonb,
  start_date                text not null,
  end_date                  text,
  status                    text not null default 'draft',  -- Definition schedule_rule_status
  default_priority          text not null default 'normal', -- Definition prioridad
  default_estimated_minutes int,
  default_payload           jsonb not null default '{}'::jsonb,
  source_key                text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  created_by                uuid,
  updated_by                uuid
);
create index if not exists schedule_rules_org_idx on schedule_rules (org_id);
create index if not exists schedule_rules_org_status_idx on schedule_rules (org_id, status);
create index if not exists schedule_rules_org_kind_idx on schedule_rules (org_id, kind);
create unique index if not exists schedule_rules_org_source_key_uq on schedule_rules (org_id, source_key) where source_key is not null;

alter table schedule_rules enable row level security;
alter table schedule_rules force row level security;
drop policy if exists schedule_rules_tenant_isolation on schedule_rules;
create policy schedule_rules_tenant_isolation on schedule_rules
  using      (org_id = nullif(current_setting('app.org_id', true), '')::uuid)
  with check (org_id = nullif(current_setting('app.org_id', true), '')::uuid);
grant select, insert, update, delete on schedule_rules to mj_brasil_app;

-- ── schedule_rule_items — the polymorphic scope ───────────────────────────────────────────────
create table if not exists schedule_rule_items (
  id                       uuid primary key default gen_random_uuid(),
  org_id                   uuid not null default nullif(current_setting('app.org_id', true), '')::uuid,
  rule_id                  uuid not null,
  target_kind              text not null,                   -- Definition target_kind
  location_id              uuid,
  asset_id                 uuid,
  frequency_days_override  int,
  anchor_date              text,
  payload_override         jsonb,
  archived_at              timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  created_by               uuid,
  updated_by               uuid
);
create index if not exists schedule_rule_items_org_idx on schedule_rule_items (org_id);
create index if not exists schedule_rule_items_org_rule_idx on schedule_rule_items (org_id, rule_id);

alter table schedule_rule_items enable row level security;
alter table schedule_rule_items force row level security;
drop policy if exists schedule_rule_items_tenant_isolation on schedule_rule_items;
create policy schedule_rule_items_tenant_isolation on schedule_rule_items
  using      (org_id = nullif(current_setting('app.org_id', true), '')::uuid)
  with check (org_id = nullif(current_setting('app.org_id', true), '')::uuid);
grant select, insert, update, delete on schedule_rule_items to mj_brasil_app;

-- ── tasks — THE shared field-work machine ─────────────────────────────────────────────────────
create table if not exists tasks (
  id                      uuid primary key default gen_random_uuid(),
  org_id                  uuid not null default nullif(current_setting('app.org_id', true), '')::uuid,
  kind                    text not null,                    -- Definition task_kind (immutable)
  status                  text not null default 'planned',  -- Definition task_status (transition() only)
  priority                text not null default 'normal',   -- Definition prioridad
  title                   text not null,
  description             text,
  target_kind             text,
  location_id             uuid,
  asset_id                uuid,
  target_label            text,
  schedule_rule_id        uuid,
  schedule_rule_item_id   uuid,
  source_module           text,
  source_event_kind       text,
  source_ref_id           uuid,
  dedupe_key              text,
  due_date                text,
  due_at                  timestamptz,
  scheduled_date          text,
  scheduled_window_start  time,
  scheduled_window_end    time,
  estimated_minutes       int,
  actual_start            timestamptz,
  actual_end              timestamptz,
  hold_reason             text,
  hold_started_at         timestamptz,
  hold_minutes_total      int not null default 0,
  completed_at            timestamptz,
  completed_by            text,
  closed_at               timestamptz,
  closed_by               text,
  reopen_count            int not null default 0,
  outcome_note            text,
  rescheduled_to_task_id  uuid,
  payload                 jsonb not null default '{}'::jsonb,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  created_by              uuid,
  updated_by              uuid
);
create index if not exists tasks_org_idx on tasks (org_id);
create index if not exists tasks_org_sched_idx on tasks (org_id, scheduled_date);
create index if not exists tasks_org_status_sched_idx on tasks (org_id, status, scheduled_date);
create index if not exists tasks_org_kind_status_idx on tasks (org_id, kind, status);
create index if not exists tasks_org_due_idx on tasks (org_id, due_date);
create index if not exists tasks_org_rule_item_idx on tasks (org_id, schedule_rule_item_id);
create unique index if not exists tasks_org_rule_item_due_uq on tasks (org_id, schedule_rule_item_id, due_date) where schedule_rule_item_id is not null;
create unique index if not exists tasks_org_dedupe_uq on tasks (org_id, dedupe_key) where dedupe_key is not null;

alter table tasks enable row level security;
alter table tasks force row level security;
drop policy if exists tasks_tenant_isolation on tasks;
create policy tasks_tenant_isolation on tasks
  using      (org_id = nullif(current_setting('app.org_id', true), '')::uuid)
  with check (org_id = nullif(current_setting('app.org_id', true), '')::uuid);
grant select, insert, update, delete on tasks to mj_brasil_app;

-- ── task_assignments — M2M staff/crew, one live lead per task ──────────────────────────────────
create table if not exists task_assignments (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null default nullif(current_setting('app.org_id', true), '')::uuid,
  task_id         uuid not null,
  membership_id   uuid not null,
  role            text not null default 'apoyo',            -- Definition assignment_role
  assigned_by     text,
  claimed_at      timestamptz,
  released_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid,
  updated_by      uuid
);
create index if not exists task_assignments_org_idx on task_assignments (org_id);
create index if not exists task_assignments_org_member_idx on task_assignments (org_id, membership_id, created_at);
create unique index if not exists task_assignments_one_lead_uq on task_assignments (task_id) where role = 'lead' and released_at is null;
create unique index if not exists task_assignments_one_member_uq on task_assignments (task_id, membership_id) where released_at is null;

alter table task_assignments enable row level security;
alter table task_assignments force row level security;
drop policy if exists task_assignments_tenant_isolation on task_assignments;
create policy task_assignments_tenant_isolation on task_assignments
  using      (org_id = nullif(current_setting('app.org_id', true), '')::uuid)
  with check (org_id = nullif(current_setting('app.org_id', true), '')::uuid);
grant select, insert, update, delete on task_assignments to mj_brasil_app;
