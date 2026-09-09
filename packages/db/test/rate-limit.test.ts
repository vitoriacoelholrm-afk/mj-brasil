// rateLimit — the fixed-window limiter behind the anonymous public surface, against real Postgres.
// Pins the two properties the security fix needs: it blocks once the window limit is hit, and it
// counts ATOMICALLY under concurrency (no read-then-write undercount across serverless invocations).
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { rateLimit } from '../src/chassis/rateLimit';

const HAS_DB = !!process.env.DATABASE_URL_ADMIN;
// A wide window so the test never straddles a window boundary (no flake).
const WIN = 3600;

describe.skipIf(!HAS_DB)('rateLimit (real Postgres, fixed window)', () => {
  let admin: any;
  const wipe = async () => { await admin`delete from rate_limit_hits where bucket like 'test:rl:%'`; };
  beforeAll(async () => { const { _raw } = await import('../src/client'); admin = _raw.adminSql(); await wipe(); });
  afterAll(async () => { if (admin) await wipe(); });

  it('allows up to the limit, then blocks within the window with a retry hint', async () => {
    const out = [];
    for (let i = 0; i < 5; i++) out.push(await rateLimit('test:rl:a', 3, WIN));
    expect(out.map((r) => r.allowed)).toEqual([true, true, true, false, false]);
    expect(out[2].remaining).toBe(0);
    expect(out[3].retryAfterSeconds).toBeGreaterThan(0);
    expect(out[3].retryAfterSeconds).toBeLessThanOrEqual(WIN);
  });

  it('buckets are independent', async () => {
    expect((await rateLimit('test:rl:b', 1, WIN)).allowed).toBe(true);
    expect((await rateLimit('test:rl:c', 1, WIN)).allowed).toBe(true);
    expect((await rateLimit('test:rl:b', 1, WIN)).allowed).toBe(false); // b is now exhausted, c is not
  });

  it('counts atomically under concurrency — no undercount (the serverless-flood guarantee)', async () => {
    const N = 12;
    const rs = await Promise.all(Array.from({ length: N }, () => rateLimit('test:rl:conc', 1000, WIN)));
    const hits = rs.map((r) => r.hits).sort((x, y) => x - y);
    expect(hits).toEqual(Array.from({ length: N }, (_, i) => i + 1)); // 1..N distinct → every increment landed
  });
});
