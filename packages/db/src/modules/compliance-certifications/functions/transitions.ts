// compliance-certifications machines + pure compute helpers (spec §2, §4.2) — testable without a DB.
// Three small lifecycles (obligation, credential, issued document) + the semáforo / expiry-stage
// math that the board and the sweep depend on. PURE (no db); this is the file the catalog contract
// test targets. Back-ported from copafix (packages/db/src/compliance-certifications/transitions.ts);
// the only re-point: defValues(NAME) → catalog.values(NAME) (a lower-level shared primitive, allowed
// hard import of the definitions registry).
import { catalog } from '@astralitics/definitions';

// ── obligation lifecycle: draft→active⇄suspended→retired ────────────────────────────────────────
export const OBLIGATION_TRANSITIONS: Record<string, readonly string[]> = {
  draft: ['active'],
  active: ['suspended', 'retired'],
  suspended: ['active', 'retired'],
  retired: [],
};
export function isLegalObligation(from: string, to: string): boolean {
  if (!(catalog.values('obligation_status') as readonly string[]).includes(to)) return false;
  return (OBLIGATION_TRANSITIONS[from] ?? []).includes(to);
}

// ── credential lifecycle: active→{expired,suspended,revoked,superseded} ─────────────────────────
export const CREDENTIAL_TRANSITIONS: Record<string, readonly string[]> = {
  active: ['expired', 'suspended', 'revoked', 'superseded'],
  expired: ['superseded'],
  suspended: ['active', 'revoked'],
  revoked: [],
  superseded: [],
};
export function isLegalCredential(from: string, to: string): boolean {
  if (!(catalog.values('credential_status') as readonly string[]).includes(to)) return false;
  return (CREDENTIAL_TRANSITIONS[from] ?? []).includes(to);
}

// ── expiry stage math (the 30/15/7 engine) ───────────────────────────────────────────────────────
const DAY = 86400000;
/** Whole days from `asOf` to `expiresAt` (negative = already past). */
export function daysUntil(expiresAt: string, asOf: Date): number {
  const e = new Date(expiresAt + 'T00:00:00Z').getTime();
  const a = Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), asOf.getUTCDate());
  return Math.floor((e - a) / DAY);
}
/** Map days-remaining → the alert stage (or null if outside the first threshold). */
export function alertStageFor(expiresAt: string | null, asOf: Date, thresholds: number[] = [30, 15, 7]): string | null {
  if (!expiresAt) return null;
  const d = daysUntil(expiresAt, asOf);
  if (d < 0) return 'expired';
  const asc = [...thresholds].sort((a, b) => a - b); // 7,15,30
  for (const t of asc) if (d <= t) return `d${t}`;
  return null;
}
const STAGE_RANK: Record<string, number> = { d30: 1, d15: 2, d7: 3, expired: 4 };
/** True if `next` is a later (more urgent) stage than `prev` — so the sweep notifies once per stage. */
export function stageAdvanced(prev: string | null, next: string | null): boolean {
  if (!next) return false;
  return (STAGE_RANK[next] ?? 0) > (STAGE_RANK[prev ?? ''] ?? 0);
}

// ── the semáforo (computeLight) ──────────────────────────────────────────────────────────────────
export type Light = 'verde' | 'amarillo' | 'rojo' | 'gris';
/** Pure traffic-light for an obligation given its status, next due date, last event result, and
 *  (for document_only) the required credential's status. The board never stores this — it computes. */
export function computeLight(input: {
  status: string;
  nextDueDate: string | null;
  lastResult: string | null;
  hasBaseline: boolean;
  requiredCredentialStatus?: string | null; // for document_only
  asOf: Date;
  firstThreshold?: number;
}): Light {
  if (input.status === 'draft' || input.status === 'suspended') return 'gris';
  if (input.requiredCredentialStatus !== undefined) {
    // document_only: the credential's vigencia is the signal
    if (input.requiredCredentialStatus == null || input.requiredCredentialStatus === 'expired') return 'rojo';
  }
  if (input.lastResult === 'no_cumplida') return 'rojo';
  if (!input.hasBaseline && !input.nextDueDate) return 'gris';
  if (input.nextDueDate) {
    const d = daysUntil(input.nextDueDate, input.asOf);
    if (d < 0) return 'rojo';
    if (d <= (input.firstThreshold ?? 30)) return 'amarillo';
  }
  return 'verde';
}
