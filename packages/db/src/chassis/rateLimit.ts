// rateLimit — a fixed-window limiter for the anonymous public surface (D-spine follow-up; the public
// QR intake is unauthenticated, so it must be throttled before it can flood a tenant's board). The
// counter lives in `rate_limit_hits` (cross-tenant system infra, no org_id) and is incremented with a
// single atomic upsert+returning, so concurrent serverless invocations can't undercount. Uses the
// admin role (the table has no RLS and the IP bucket is org-agnostic). Window-fixed, not sliding —
// simplest correct shape; a row exists per (bucket, window). Fail-OPEN on a limiter error: a counter
// outage must never take down intake (logged by the caller, not enforced).
import { _raw } from '../client.js';

export interface RateLimitResult {
  allowed: boolean;
  hits: number;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
}

/** Count one hit against `bucket` in the current fixed window; allowed while hits ≤ limit. */
export async function rateLimit(bucket: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const sql = _raw.adminSql();
  const rows = (await sql`
    with w as (
      select to_timestamp(floor(extract(epoch from now()) / ${windowSeconds}) * ${windowSeconds}) as window_start
    )
    insert into rate_limit_hits (bucket, window_start, hits)
    select ${bucket}, w.window_start, 1 from w
    on conflict (bucket, window_start) do update set hits = rate_limit_hits.hits + 1
    returning hits, ceil(extract(epoch from (window_start + make_interval(secs => ${windowSeconds}) - now())))::int as retry_after
  `) as unknown as Array<{ hits: number; retry_after: number }>;
  const hits = Number(rows[0].hits);
  const retryAfterSeconds = Math.max(0, Number(rows[0].retry_after));
  return { allowed: hits <= limit, hits, limit, remaining: Math.max(0, limit - hits), retryAfterSeconds };
}
