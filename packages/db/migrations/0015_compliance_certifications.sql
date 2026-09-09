-- 0001_compliance_certifications.sql — the single vencimientos engine (spec §2): compliance_obligations
-- (normative requirements with cadence) + credential_records (the polymorphic artifact that expires,
-- expiry-indexed) + compliance_events (append-only gap-free chronology) + issued_documents (folio +
-- snapshot). Owned by the compliance-certifications catalog module (renumbered from copafix's 0006).
-- RLS appendix mandatory on every org_id table (check:rls). Additive-only (ADR-06). The task-spawning
-- halves of expirySweep wire (via injected deps) when scheduling-field-service + platform-core land.
-- The grant role is the install-time placeholder mj_brasil_app (the control-plane's migration-gen, G17, fills it).

create extension if not exists pgcrypto;

-- ── compliance_obligations — the normative requirement with cadence ───────────────────────────
create table if not exists compliance_obligations (
  id                       uuid primary key default gen_random_uuid(),
  org_id                   uuid not null default nullif(current_setting('app.org_id', true), '')::uuid,
  name                     text not null,
  norm_ref                 text,
  authority                text,
  domain                   text not null default 'interno',   -- Definition compliance_domain
  description              text,
  risk_note                text,
  fulfillment_mode         text not null,                     -- Definition obligation_fulfillment_mode
  frequency_days           int,
  grace_days               int not null default 5,
  schedule_rule_id         uuid,
  required_credential_kind text,
  scope                    jsonb,
  evidence_requirements    jsonb not null default '[]'::jsonb,
  responsible_kind         text not null default 'interno',   -- Definition obligation_responsible
  vendor_id                uuid,
  spawn_task_kind          text,
  spawn_lead_days          int not null default 14,
  retention_years          int,
  next_due_date            text,
  status                   text not null default 'draft',     -- Definition obligation_status
  anchor_date              text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  created_by               uuid,
  updated_by               uuid
);
create index if not exists compliance_obligations_org_idx on compliance_obligations (org_id);
create index if not exists compliance_obligations_org_status_idx on compliance_obligations (org_id, status);
create index if not exists compliance_obligations_org_due_idx on compliance_obligations (org_id, next_due_date);
create index if not exists compliance_obligations_org_domain_idx on compliance_obligations (org_id, domain);

alter table compliance_obligations enable row level security;
alter table compliance_obligations force row level security;
drop policy if exists compliance_obligations_tenant_isolation on compliance_obligations;
create policy compliance_obligations_tenant_isolation on compliance_obligations
  using      (org_id = nullif(current_setting('app.org_id', true), '')::uuid)
  with check (org_id = nullif(current_setting('app.org_id', true), '')::uuid);
grant select, insert, update, delete on compliance_obligations to mj_brasil_app;

-- ── credential_records — the polymorphic artifact that expires (expiry-indexed) ───────────────
create table if not exists credential_records (
  id                 uuid primary key default gen_random_uuid(),
  org_id             uuid not null default nullif(current_setting('app.org_id', true), '')::uuid,
  holder_kind        text not null,                           -- Definition credential_holder_kind
  holder_id          uuid,
  holder_label       text not null,
  kind               text not null,                           -- Definition credential_kind
  title              text,
  number             text,
  issuing_authority  text,
  issued_at          text,
  expires_at         text,
  document_id        uuid,
  obligation_id      uuid,
  status             text not null default 'active',          -- Definition credential_status
  replaced_by_id     uuid,
  alert_stage        text,
  revoke_reason      text,
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  created_by         uuid,
  updated_by         uuid
);
create index if not exists credential_records_org_idx on credential_records (org_id);
create index if not exists credential_records_org_expires_idx on credential_records (org_id, expires_at);
create index if not exists credential_records_org_holder_idx on credential_records (org_id, holder_kind, holder_id);
create index if not exists credential_records_org_kind_status_idx on credential_records (org_id, kind, status);

alter table credential_records enable row level security;
alter table credential_records force row level security;
drop policy if exists credential_records_tenant_isolation on credential_records;
create policy credential_records_tenant_isolation on credential_records
  using      (org_id = nullif(current_setting('app.org_id', true), '')::uuid)
  with check (org_id = nullif(current_setting('app.org_id', true), '')::uuid);
grant select, insert, update, delete on credential_records to mj_brasil_app;

-- ── compliance_events — the append-only gap-free chronology ───────────────────────────────────
create table if not exists compliance_events (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null default nullif(current_setting('app.org_id', true), '')::uuid,
  obligation_id     uuid,
  credential_id     uuid,
  kind              text not null,                            -- Definition compliance_event_kind
  result            text,                                     -- Definition compliance_event_result
  occurred_at       timestamptz not null default now(),
  period_key        text,
  source_module     text,
  source_task_id    uuid,
  evidence          jsonb not null default '[]'::jsonb,
  reading_summary   jsonb,
  corrects_event_id uuid,
  note              text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid,
  updated_by        uuid
);
create index if not exists compliance_events_org_idx on compliance_events (org_id);
create index if not exists compliance_events_org_obl_idx on compliance_events (org_id, obligation_id, occurred_at desc);
create unique index if not exists compliance_events_org_src_task_uq on compliance_events (org_id, source_task_id) where source_task_id is not null;

alter table compliance_events enable row level security;
alter table compliance_events force row level security;
drop policy if exists compliance_events_tenant_isolation on compliance_events;
create policy compliance_events_tenant_isolation on compliance_events
  using      (org_id = nullif(current_setting('app.org_id', true), '')::uuid)
  with check (org_id = nullif(current_setting('app.org_id', true), '')::uuid);
grant select, insert, update, delete on compliance_events to mj_brasil_app;

-- ── issued_documents — the folio + snapshot register ──────────────────────────────────────────
create table if not exists issued_documents (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null default nullif(current_setting('app.org_id', true), '')::uuid,
  kind          text not null,                                -- Definition issued_document_kind
  number        text not null,                                -- ORG-YYYY-NNNNN
  year          int not null,
  seq           int not null,
  title         text not null,
  obligation_id uuid,
  norm_ref      text,
  period_from   text,
  period_to     text,
  snapshot      jsonb not null,
  document_id   uuid,
  issued_at     timestamptz not null default now(),
  issued_by     text not null,
  status        text not null default 'issued',               -- Definition issued_document_status
  voided_at     timestamptz,
  voided_by     text,
  void_reason   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    uuid,
  updated_by    uuid,
  constraint issued_documents_org_number_uq unique (org_id, number)
);
create index if not exists issued_documents_org_idx on issued_documents (org_id);
create index if not exists issued_documents_org_year_seq_idx on issued_documents (org_id, year, seq);
create index if not exists issued_documents_org_obl_idx on issued_documents (org_id, obligation_id);

alter table issued_documents enable row level security;
alter table issued_documents force row level security;
drop policy if exists issued_documents_tenant_isolation on issued_documents;
create policy issued_documents_tenant_isolation on issued_documents
  using      (org_id = nullif(current_setting('app.org_id', true), '')::uuid)
  with check (org_id = nullif(current_setting('app.org_id', true), '')::uuid);
grant select, insert, update, delete on issued_documents to mj_brasil_app;
