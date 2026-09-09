-- 0001_facility_spaces.sql — the location tree + the append-only room-status event log
-- (facility-spaces spec §2.1–§2.2). Owned by the facility-spaces catalog module; module-local
-- numbering restarts at 0001 (copafix global was 0003). SpaceBlock / SpaceBlockRoom / OccupancyInput
-- (the FU overlay + occupancy feed) land in a later increment. RLS appendix mandatory on every org_id
-- table (check:rls). Additive-only (ADR-06). The literal app role is mj_brasil_app (control-plane
-- migration-gen fills it per install, G17).

create extension if not exists pgcrypto;

-- ── locations — the physical tree (property > floor > room/area) ──────────────────────────────
create table if not exists locations (
  id                       uuid primary key default gen_random_uuid(),
  org_id                   uuid not null default nullif(current_setting('app.org_id', true), '')::uuid,
  kind                     text not null,                 -- Definition location_kind
  parent_id                uuid,                          -- soft self-ref
  code                     text not null,
  name                     text not null,
  floor_number             int,
  room_type                text,                          -- Definition room_type (rooms only)
  fachada_zone             text,                          -- Definition fachada_zone (rooms only)
  area_categoria           text,                          -- Definition area_operativa (areas only)
  qr_token                 text,
  current_status           text,                          -- Definition space_status; read model, rooms only
  current_status_event_id  uuid,                          -- head of the event log (optimistic precondition)
  current_block_id         uuid,                          -- active block overlay (FU)
  attributes               jsonb not null default '{}'::jsonb,
  is_active                boolean not null default true,
  sort_order               int,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  created_by               uuid,
  updated_by               uuid,
  constraint locations_org_code_uq unique (org_id, code)
);
create index if not exists locations_org_idx on locations (org_id);
create index if not exists locations_org_kind_idx on locations (org_id, kind);
create index if not exists locations_org_parent_idx on locations (org_id, parent_id);
create unique index if not exists locations_org_qr_uq on locations (org_id, qr_token) where qr_token is not null;

alter table locations enable row level security;
alter table locations force row level security;
drop policy if exists locations_tenant_isolation on locations;
create policy locations_tenant_isolation on locations
  using      (org_id = nullif(current_setting('app.org_id', true), '')::uuid)
  with check (org_id = nullif(current_setting('app.org_id', true), '')::uuid);
grant select, insert, update, delete on locations to mj_brasil_app;

-- ── space_status_events — the append-only source of truth (never updated/deleted) ─────────────
create table if not exists space_status_events (
  id                   uuid primary key default gen_random_uuid(),
  org_id               uuid not null default nullif(current_setting('app.org_id', true), '')::uuid,
  location_id          uuid not null,                     -- always kind=room
  from_status          text,                              -- Definition space_status; null at genesis
  to_status            text not null,                     -- Definition space_status
  source               text not null,                     -- Definition status_event_source
  reason_code          text,                              -- Definition status_reason (required on down-rank, R4)
  note                 text,
  task_id              uuid,
  block_id             uuid,
  occupancy_input_id   uuid,
  actor_membership_id  uuid,
  client_ts            timestamptz,                       -- device time (offline outbox); created_at = server time
  idempotency_key      text not null,
  prev_event_id        uuid,                              -- head the client saw when enqueuing (staleness precondition)
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  created_by           uuid,
  updated_by           uuid,
  constraint space_status_events_org_idem_uq unique (org_id, idempotency_key)
);
create index if not exists space_status_events_org_idx on space_status_events (org_id);
create index if not exists space_status_events_org_loc_idx on space_status_events (org_id, location_id, created_at desc);

alter table space_status_events enable row level security;
alter table space_status_events force row level security;
drop policy if exists space_status_events_tenant_isolation on space_status_events;
create policy space_status_events_tenant_isolation on space_status_events
  using      (org_id = nullif(current_setting('app.org_id', true), '')::uuid)
  with check (org_id = nullif(current_setting('app.org_id', true), '')::uuid);
grant select, insert, update, delete on space_status_events to mj_brasil_app;
