-- 0004_equipment_maintenance.sql — the asset-registry slice of equipment-maintenance (spec §2.1–§2.3,
-- §2.5): assets (tree) + asset_meters (ranges) + meter_readings (append-only) + asset_events
-- (timeline). The OT facet (maintenance_order_details, §2.4) lands with scheduling-field-service.
-- Owned by the equipment-maintenance catalog module; a copafix migration pending control-plane
-- migration-gen (G17). RLS appendix mandatory on every org_id table (check:rls). Additive (ADR-06).

create extension if not exists pgcrypto;

-- ── assets — the registry: every maintainable physical thing (tree) ───────────────────────────
create table if not exists assets (
  id                   uuid primary key default gen_random_uuid(),
  org_id               uuid not null default nullif(current_setting('app.org_id', true), '')::uuid,
  parent_asset_id      uuid,                          -- soft self-ref → tree
  code                 text not null,                 -- EQ-001… (QR anchor)
  name                 text not null,
  kind                 text not null default 'equipo',     -- Definition tipo_activo
  area                 text not null,                 -- Definition area_operativa (owner facility-spaces)
  location_id          uuid,                          -- soft → facility-spaces.locations
  criticality          text not null default 'Estándar',   -- Definition prioridad_equipo
  health_status        text not null default 'ok',         -- Definition estado_salud_equipo (setAssetHealth only)
  health_note          text,
  lifecycle_status     text not null default 'activo',     -- Definition estado_registro_activo
  brand                text,
  model                text,
  serial_number        text,
  vendor_id            uuid,                          -- soft → vendor-management.vendors
  vendor_contact       text,
  purchase_date        text,
  warranty_expires_at  text,
  warranty_notes       text,
  pm_frequencies       text[] not null default '{}', -- Definition frecuencia_preset[]
  last_maintenance_at  timestamptz,
  specs                jsonb not null default '{}'::jsonb,
  qr_token             text not null,
  notes                text,
  retired_at           timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  created_by           uuid,
  updated_by           uuid,
  constraint assets_org_code_uq unique (org_id, code),
  constraint assets_org_qr_uq   unique (org_id, qr_token)
);
create index if not exists assets_org_idx on assets (org_id);
create index if not exists assets_org_area_idx on assets (org_id, area);
create index if not exists assets_org_crit_idx on assets (org_id, criticality);
create index if not exists assets_org_health_idx on assets (org_id, health_status);
create index if not exists assets_org_parent_idx on assets (org_id, parent_asset_id);

alter table assets enable row level security;
alter table assets force row level security;
drop policy if exists assets_tenant_isolation on assets;
create policy assets_tenant_isolation on assets
  using      (org_id = nullif(current_setting('app.org_id', true), '')::uuid)
  with check (org_id = nullif(current_setting('app.org_id', true), '')::uuid);
grant select, insert, update, delete on assets to mj_brasil_app;

-- ── asset_meters — measurement points with optional ranges ────────────────────────────────────
create table if not exists asset_meters (
  id                   uuid primary key default gen_random_uuid(),
  org_id               uuid not null default nullif(current_setting('app.org_id', true), '')::uuid,
  asset_id             uuid not null,                 -- → assets (intra-module)
  name                 text not null,
  meter_type           text not null,                 -- Definition tipo_medidor
  unit                 text not null,
  is_cumulative        boolean not null default false,
  min_value            numeric,
  max_value            numeric,
  reading_frequency    text,                          -- Definition frecuencia_preset
  out_of_range_action  text not null default 'crear_solicitud',  -- Definition accion_fuera_de_rango
  corrective_template  jsonb,
  current_value        numeric,
  current_value_at     timestamptz,
  active               boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  created_by           uuid,
  updated_by           uuid
);
create index if not exists asset_meters_org_idx on asset_meters (org_id);
create index if not exists asset_meters_org_asset_idx on asset_meters (org_id, asset_id);

alter table asset_meters enable row level security;
alter table asset_meters force row level security;
drop policy if exists asset_meters_tenant_isolation on asset_meters;
create policy asset_meters_tenant_isolation on asset_meters
  using      (org_id = nullif(current_setting('app.org_id', true), '')::uuid)
  with check (org_id = nullif(current_setting('app.org_id', true), '')::uuid);
grant select, insert, update, delete on asset_meters to mj_brasil_app;

-- ── meter_readings — append-only readings (never updated/deleted) ─────────────────────────────
create table if not exists meter_readings (
  id                    uuid primary key default gen_random_uuid(),
  org_id                uuid not null default nullif(current_setting('app.org_id', true), '')::uuid,
  meter_id              uuid not null,                -- → asset_meters
  value                 numeric not null,
  read_at               timestamptz not null default now(),
  read_by               uuid,                         -- soft → memberships
  source                text not null default 'manual',  -- Definition fuente_lectura
  note                  text,
  photo_document_id     uuid,
  out_of_range          boolean not null default false,
  triggered_request_id  uuid,
  triggered_task_id     uuid,
  supersedes_reading_id uuid,
  idempotency_key       text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid,
  updated_by            uuid
);
create index if not exists meter_readings_org_idx on meter_readings (org_id);
create index if not exists meter_readings_org_meter_idx on meter_readings (org_id, meter_id, read_at desc);
create unique index if not exists meter_readings_org_idem_uq on meter_readings (org_id, idempotency_key) where idempotency_key is not null;

alter table meter_readings enable row level security;
alter table meter_readings force row level security;
drop policy if exists meter_readings_tenant_isolation on meter_readings;
create policy meter_readings_tenant_isolation on meter_readings
  using      (org_id = nullif(current_setting('app.org_id', true), '')::uuid)
  with check (org_id = nullif(current_setting('app.org_id', true), '')::uuid);
grant select, insert, update, delete on meter_readings to mj_brasil_app;

-- ── asset_events — the per-asset timeline (append-only) ───────────────────────────────────────
create table if not exists asset_events (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null default nullif(current_setting('app.org_id', true), '')::uuid,
  asset_id          uuid not null,                    -- → assets
  event_type        text not null,                    -- Definition tipo_evento_activo
  at                timestamptz not null default now(),
  actor             text not null,                    -- member:<id> | app | mcp:…
  note              text,
  cost              numeric,
  currency_code     text,
  vendor_id         uuid,
  task_id           uuid,
  document_id       uuid,
  track_in_finance  boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid,
  updated_by        uuid
);
create index if not exists asset_events_org_idx on asset_events (org_id);
create index if not exists asset_events_org_asset_idx on asset_events (org_id, asset_id, at desc);

alter table asset_events enable row level security;
alter table asset_events force row level security;
drop policy if exists asset_events_tenant_isolation on asset_events;
create policy asset_events_tenant_isolation on asset_events
  using      (org_id = nullif(current_setting('app.org_id', true), '')::uuid)
  with check (org_id = nullif(current_setting('app.org_id', true), '')::uuid);
grant select, insert, update, delete on asset_events to mj_brasil_app;
