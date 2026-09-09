// createContext — the HTTP adapter's job: turn a request into a RequestContext (pre-tenant).
// Auth sources: a Supabase access token (Bearer), verified against the project JWKS, or a floor-PIN
// session resolving a membershipId. The active org comes from the x-active-org header (optional in
// single-org; orgScopedProcedure validates it against real memberships).
import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { RequestContext } from './trpc.js';

// G18 CLOSED: the Supabase token is verified against the project's published JWKS (asymmetric
// ES256) — signature, expiry, and issuer are all checked. A forged or tampered token fails closed
// (returns null → UNAUTHORIZED). The JWKS is fetched once and cached by jose.
let _jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
function jwks() {
  if (!_jwks) {
    const url = process.env.SUPABASE_JWKS_URL
      ?? (process.env.SUPABASE_URL ? `${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json` : undefined);
    if (!url) throw new Error('Missing SUPABASE_JWKS_URL / SUPABASE_URL — see _chassis.md §1.6');
    _jwks = createRemoteJWKSet(new URL(url));
  }
  return _jwks;
}

async function authUserIdFromBearer(authHeader?: string): Promise<string | null> {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  try {
    const issuer = process.env.SUPABASE_URL ? `${process.env.SUPABASE_URL}/auth/v1` : undefined;
    const { payload } = await jwtVerify(token, jwks(), {
      ...(issuer ? { issuer } : {}),
      // Supabase user tokens carry aud 'authenticated'.
      audience: 'authenticated',
    });
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null; // invalid / expired / tampered → no session
  }
}

export interface CreateContextInput {
  headers: Record<string, string | undefined>;
  /** Set by the floor-PIN auth endpoint after verifying the PIN (identity-access.hashPin). */
  pinMembershipId?: string | null;
}

/** The client IP, best-effort: the first hop of x-forwarded-for (Vercel sets it), else x-real-ip. */
function clientIp(headers: Record<string, string | undefined>): string | null {
  const xff = headers['x-forwarded-for'] ?? headers['X-Forwarded-For'];
  if (xff) return xff.split(',')[0]?.trim() || null;
  return headers['x-real-ip'] ?? headers['X-Real-Ip'] ?? null;
}

export async function createContext(input: CreateContextInput): Promise<RequestContext> {
  const authUserId = await authUserIdFromBearer(input.headers['authorization'] ?? input.headers['Authorization']);
  const membershipId = input.pinMembershipId ?? null;
  return {
    auth: authUserId || membershipId ? { authUserId, membershipId } : null,
    activeOrgId: input.headers['x-active-org'] ?? null,
    ip: clientIp(input.headers),
  };
}
