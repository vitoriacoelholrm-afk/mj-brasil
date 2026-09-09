-- 0002_maintenance_order_details.sql — the OT facet (equipment-maintenance spec §2.4): the
-- maintenance-order satellite, 1:1 on a scheduling-field-service Task. The Task owns the lifecycle
-- (D7 / G11 "shared lifecycle, satellite facets"); this table carries what only maintenance knows:
-- which asset, which trade, which failure, the diagnosis, and the cost breakdown. Created only via
-- createMaintenanceOrder (Task + satellite atomic) and closed only via completeMaintenanceOrder.
-- Owned by equipment-maintenance; module-local migration (back-ported from copafix 0009). Additive
-- (ADR-06). RLS appendix mandatory on every org_id table (check:rls). The literal app role is
-- parameterized as mj_brasil_app (control-plane migration-gen / install fills it, G17).

-- ── maintenance_order_details — the OT facet (satellite 1:1 on tasks) ──────────────────────────
create table if not exists maintenance_order_details (
  id                       uuid primary key default gen_random_uuid(),
  org_id                   uuid not null default nullif(current_setting('app.org_id', true), '')::uuid,
  task_id                  uuid not null,                 -- soft → scheduling tasks; 1:1
  asset_id                 uuid,                          -- → assets (null if a space-only OT)
  location_ref             uuid,                          -- soft → facility-spaces locations
  trade                    text,                          -- Definition oficio (AC·PLO·ELE·PIN, open)
  source                   text not null default 'manual',-- Definition origen_ot
  request_id               uuid,                          -- soft → request-intake requests (the incidencia)
  failure_code_id          uuid,                          -- soft → request-intake catalogo_fallas
  diagnosis                text,
  root_cause               text,
  labor_minutes            integer,
  parts_cost               numeric(18,4),
  external_cost            numeric(18,4),
  currency_code            text not null default 'MXN',
  vendor_service_order_id  uuid,                          -- soft → vendor-management vendor_service_orders
  meter_reading_id         uuid,                          -- soft → meter_readings (source=lectura)
  checklist_item_ref       text,                          -- stable id of the failed checklist item
  completed_summary        text,
  complete_idempotency_key text,                          -- offline command replay (completeMaintenanceOrder)
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  created_by               uuid,
  updated_by               uuid,
  constraint maintenance_order_details_org_task_uq unique (org_id, task_id)
);
create index if not exists mod_org_idx on maintenance_order_details (org_id);
create index if not exists mod_org_asset_idx on maintenance_order_details (org_id, asset_id);
create index if not exists mod_org_request_idx on maintenance_order_details (org_id, request_id);
create unique index if not exists mod_org_complete_idem_uq
  on maintenance_order_details (org_id, complete_idempotency_key) where complete_idempotency_key is not null;

alter table maintenance_order_details enable row level security;
alter table maintenance_order_details force row level security;
drop policy if exists mod_tenant_isolation on maintenance_order_details;
create policy mod_tenant_isolation on maintenance_order_details
  using      (org_id = nullif(current_setting('app.org_id', true), '')::uuid)
  with check (org_id = nullif(current_setting('app.org_id', true), '')::uuid);
grant select, insert, update, delete on maintenance_order_details to mj_brasil_app;
