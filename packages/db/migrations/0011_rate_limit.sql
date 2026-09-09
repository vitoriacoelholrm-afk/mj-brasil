-- 0011_rate_limit.sql — fixed-window rate-limit counters for the anonymous public surface
-- (the public QR intake). This is CROSS-TENANT system infrastructure: the IP bucket spans tenants,
-- so the table has NO org_id and therefore needs NO RLS appendix (check:rls only governs org_id
-- tables). It is written/read via the admin role (like the snapshot/seed scripts), atomically, with
-- an upsert+returning so concurrent serverless invocations can't undercount. A reaper (cron) should
-- prune rows older than a couple of windows; growth is bounded by (#buckets × #live windows).
create table if not exists rate_limit_hits (
  bucket        text not null,
  window_start  timestamptz not null,
  hits          integer not null default 0,
  created_at    timestamptz not null default now(),
  constraint rate_limit_hits_pk primary key (bucket, window_start)
);
create index if not exists rate_limit_hits_window_idx on rate_limit_hits (window_start);

-- Grant DML to the app role too (defensive — the limiter uses admin, but keep it usable from either).
-- Conditional so this migration applies whether or not the app role exists yet: the NOBYPASSRLS app
-- role is created by the chassis spine's 0000_roles.sql (Bundle 4). mj_brasil_app is filled per app by
-- `astralitics create-app` (→ <slug>_app). Re-running is a no-op (grants are idempotent).
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'mj_brasil_app') then
    grant select, insert, update, delete on rate_limit_hits to mj_brasil_app;
  end if;
end $$;
