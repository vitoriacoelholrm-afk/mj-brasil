-- 0013_materials_inventory.sql — the materials-inventory module (spec §2), Rondo lot/movement pattern.
-- materials (catalog) + material_lots (lot/expiry, qtyReceived immutable vs qtyOnHand running) +
-- stock_movements (append-only signed ledger; corrections = compensating rows) + par_levels (config).
-- Slice 1 exercises the refacción → consume-against-Task → per-asset cost path. Owned by the
-- materials-inventory catalog module; module-shipped SQL (hand-tuned GIN + partial-unique indexes the generator would not emit).
-- RLS appendix mandatory on every org_id table (check:rls). Additive (ADR-06).

create extension if not exists pgcrypto;

-- ── materials — the catalog ───────────────────────────────────────────────────────────────────
create table if not exists materials (
  id                    uuid primary key default gen_random_uuid(),
  org_id                uuid not null default nullif(current_setting('app.org_id', true), '')::uuid,
  code                  text not null,                 -- MAT-… ; unique (org_id, code)
  name                  text not null,
  kind                  text not null,                 -- Definition material_kind
  category              text,                          -- Definition material_categoria (open)
  unit_of_measure       text not null default 'pieza', -- Definition unidad_medida
  lot_tracked           boolean not null default false,
  brand                 text,
  part_number           text,
  compatible_asset_ids  uuid[] not null default '{}',  -- soft → assets
  compatibility_note    text,
  preferred_vendor_id   uuid,                          -- soft → vendors
  default_unit_cost     numeric,
  currency_code         text not null default 'MXN',
  hazard_class          text,
  sds_document_id       uuid,
  dosage_note           text,
  photo_document_id     uuid,
  specs                 text not null default '{}',
  notes                 text,
  archived_at           timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid,
  updated_by            uuid,
  constraint materials_org_code_uq unique (org_id, code)
);
create index if not exists materials_org_kind_idx on materials (org_id, kind);
create index if not exists materials_compat_gin on materials using gin (compatible_asset_ids);

alter table materials enable row level security;
alter table materials force row level security;
drop policy if exists materials_tenant_isolation on materials;
create policy materials_tenant_isolation on materials
  using      (org_id = nullif(current_setting('app.org_id', true), '')::uuid)
  with check (org_id = nullif(current_setting('app.org_id', true), '')::uuid);
grant select, insert, update, delete on materials to mj_brasil_app;

-- ── material_lots — lot/expiry (Rondo verbatim) ───────────────────────────────────────────────
create table if not exists material_lots (
  id                    uuid primary key default gen_random_uuid(),
  org_id                uuid not null default nullif(current_setting('app.org_id', true), '')::uuid,
  material_id           uuid not null,
  lot_number            text not null,
  received_at           text not null,
  expires_at            text,
  qty_received          numeric not null,
  qty_on_hand           numeric not null,
  unit_cost             numeric,
  currency_code         text not null default 'MXN',
  vendor_id             uuid,
  received_location_id  uuid,
  status                text not null default 'active', -- Definition lot_status
  disposal_note         text,
  disposal_document_id  uuid,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid,
  updated_by            uuid,
  constraint material_lots_org_material_lot_uq unique (org_id, material_id, lot_number)
);
create index if not exists material_lots_expiry_idx on material_lots (org_id, expires_at);
create index if not exists material_lots_material_idx on material_lots (org_id, material_id);

alter table material_lots enable row level security;
alter table material_lots force row level security;
drop policy if exists material_lots_tenant_isolation on material_lots;
create policy material_lots_tenant_isolation on material_lots
  using      (org_id = nullif(current_setting('app.org_id', true), '')::uuid)
  with check (org_id = nullif(current_setting('app.org_id', true), '')::uuid);
grant select, insert, update, delete on material_lots to mj_brasil_app;

-- ── stock_movements — the append-only ledger ──────────────────────────────────────────────────
create table if not exists stock_movements (
  id                    uuid primary key default gen_random_uuid(),
  org_id                uuid not null default nullif(current_setting('app.org_id', true), '')::uuid,
  material_id           uuid not null,
  lot_id                uuid,
  kind                  text not null,                 -- Definition movement_kind
  qty_delta             numeric not null,              -- signed
  uom                   text not null,                 -- snapshot of material.unit_of_measure
  location_id           uuid not null,                 -- soft → locations
  task_id               uuid,                          -- soft → tasks (kind=consumo)
  transfer_group_id     uuid,
  reverses_movement_id  uuid,
  count_batch_id        uuid,
  baja_reason           text,                          -- Definition baja_reason
  unit_cost             numeric,
  currency_code         text default 'MXN',
  dose_note             text,
  document_id           uuid,
  moved_at              timestamptz not null default now(),
  moved_by              uuid,
  note                  text,
  idempotency_key       text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid,
  updated_by            uuid
);
create index if not exists stock_movements_onhand_idx on stock_movements (org_id, material_id, location_id, moved_at);
create index if not exists stock_movements_task_idx on stock_movements (org_id, task_id) where task_id is not null;
create index if not exists stock_movements_kind_idx on stock_movements (org_id, kind, moved_at);
-- a movement is reversed at most once; an offline command replays at most once.
create unique index if not exists stock_movements_reverses_uq on stock_movements (reverses_movement_id) where reverses_movement_id is not null;
create unique index if not exists stock_movements_idem_uq on stock_movements (org_id, idempotency_key) where idempotency_key is not null;

alter table stock_movements enable row level security;
alter table stock_movements force row level security;
drop policy if exists stock_movements_tenant_isolation on stock_movements;
create policy stock_movements_tenant_isolation on stock_movements
  using      (org_id = nullif(current_setting('app.org_id', true), '')::uuid)
  with check (org_id = nullif(current_setting('app.org_id', true), '')::uuid);
grant select, insert, update, delete on stock_movements to mj_brasil_app;

-- ── par_levels — par config per (material, stock location) ────────────────────────────────────
create table if not exists par_levels (
  id                    uuid primary key default gen_random_uuid(),
  org_id                uuid not null default nullif(current_setting('app.org_id', true), '')::uuid,
  material_id           uuid not null,
  location_id           uuid not null,
  one_par               numeric not null,
  target_pars           numeric not null default 1,
  min_pars              numeric not null default 1,
  basis_note            text,
  active                boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid,
  updated_by            uuid,
  constraint par_levels_org_material_location_uq unique (org_id, material_id, location_id)
);

alter table par_levels enable row level security;
alter table par_levels force row level security;
drop policy if exists par_levels_tenant_isolation on par_levels;
create policy par_levels_tenant_isolation on par_levels
  using      (org_id = nullif(current_setting('app.org_id', true), '')::uuid)
  with check (org_id = nullif(current_setting('app.org_id', true), '')::uuid);
grant select, insert, update, delete on par_levels to mj_brasil_app;
