// scheduling-field-service machines + pure helpers (spec §2.3.1, §4.2) — testable without a DB.
// The shared Task transition map (the single source of truth applyTransition enforces server-side),
// the schedule-rule lifecycle, the DST-free UTC-day date helpers (ported verbatim from Rondo
// contracts.ts:385-401), and computeNextDueDates — the heart of generateTasks (Rondo generateVisits).
// Back-ported from copafix; the ONLY rewrite is defValues('<name>') → catalog.values('<name>')
// (the catalog Definition registry replaces copafix's name-keyed _vocabulary helper). This module is
// PURE (no db) and is the contract-test target. The @astralitics/definitions import is a low-level
// shared primitive (G24-safe).
import { catalog } from '@astralitics/definitions';

// ── Task transition map (kind-scoped) ───────────────────────────────────────────────────────────
// Base adjacency; some edges are restricted by kind (see KIND_RESTRICTED). rescheduled is reached
// only via rescheduleTask (a replacement row), never a direct transition.
export const TASK_TRANSITIONS: Record<string, readonly string[]> = {
  planned: ['scheduled', 'cancelled'],
  scheduled: ['in_progress', 'on_hold', 'no_access', 'skipped', 'cancelled'],
  in_progress: ['on_hold', 'completed', 'skipped', 'no_access'],
  on_hold: ['in_progress', 'cancelled'],
  completed: ['closed', 'in_progress'], // → in_progress = verification reopen
  closed: [], skipped: [], no_access: [], cancelled: [], rescheduled: [],
};
// no_access is only for guest-space work; ronda/montaje use skipped instead.
const NO_ACCESS_KINDS = new Set(['ot', 'limpieza', 'inspeccion']);

export const TERMINAL_TASK = new Set(['closed', 'skipped', 'no_access', 'cancelled', 'rescheduled']);
export const isTaskTerminal = (s: string): boolean => TERMINAL_TASK.has(s);

export function isLegalTransition(from: string, to: string, kind: string): boolean {
  if (!(catalog.values('task_status') as readonly string[]).includes(to)) return false;
  if (!(TASK_TRANSITIONS[from] ?? []).includes(to)) return false;
  if (to === 'no_access' && !NO_ACCESS_KINDS.has(kind)) return false;
  return true;
}

/** The legal next statuses from `from` for a `kind` (what the UI renders as tappable). */
export function legalNext(from: string, kind: string): string[] {
  return (TASK_TRANSITIONS[from] ?? []).filter((to) => to !== 'no_access' || NO_ACCESS_KINDS.has(kind));
}

// Verification gate (config verificationKinds, default ot|limpieza): for OTHER kinds, completed
// auto-chains to closed in the same transaction.
const VERIFICATION_KINDS = new Set(['ot', 'limpieza']);
export const needsVerification = (kind: string): boolean => VERIFICATION_KINDS.has(kind);

// ── schedule-rule lifecycle ──────────────────────────────────────────────────────────────────────
export const RULE_TRANSITIONS: Record<string, readonly string[]> = {
  draft: ['active', 'cancelled'],
  active: ['paused', 'expired', 'cancelled'],
  paused: ['active', 'cancelled'],
  expired: [], cancelled: [],
};
export function isLegalRuleTransition(from: string, to: string): boolean {
  if (!(catalog.values('schedule_rule_status') as readonly string[]).includes(to)) return false;
  return (RULE_TRANSITIONS[from] ?? []).includes(to);
}

// frecuencia_preset → frequency_days (spec §3 value-map; the column stores the int, the preset is UI
// sugar). Owned here (scheduling-field-service owns frecuencia_preset); equipment.syncPmSchedules +
// the seeds read it so there's ONE frequency vocabulary on both sides of syncPmSchedules.
export const FRECUENCIA_DIAS: Record<string, number> = {
  Diario: 1, Semanal: 7, Quincenal: 15, Mensual: 30, Trimestral: 91, Semestral: 182, Anual: 365,
};

// ── DST-free UTC-day date helpers (Rondo contracts.ts:385-401, verbatim) ────────────────────────
export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
export function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
export function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setUTCDate(out.getUTCDate() + n);
  return out;
}
/** min of two ISO dates (clamp the horizon to end_date). */
export const minIso = (a: string, b: string | null): string => (b && b < a ? b : a);

// ── computeNextDueDates — the heart of generateTasks (Rondo generateVisits port) ─────────────────
export interface NextDuesInput {
  cadenceDays: number;          // item.frequency_days_override ?? rule.default_frequency_days
  anchor: string | null;        // item.anchor_date ?? rule.start_date
  lastDue: string | null;       // MAX(due_date) of existing tasks for this item (continuation)
  through: string;              // effectiveThrough = min(throughDate ?? today+lead, end_date)
  existingDues: ReadonlySet<string>;  // due_dates already generated (per-date idempotency)
}
export interface NextDuesResult { dues: string[]; skipped: number; unanchored: boolean }

/** Fixed-mode series generation (the Rondo while-loop, line-for-line). Returns the new due dates to
 *  insert + the count of already-existing dates skipped. If the anchor is unresolvable, unanchored=true
 *  and nothing is generated (the "sin fecha base" debt is surfaced, never silently dropped). */
export function computeNextDueDates(i: NextDuesInput): NextDuesResult {
  if (i.cadenceDays < 1) return { dues: [], skipped: 0, unanchored: false };
  if (!i.anchor) return { dues: [], skipped: 0, unanchored: true };
  const limit = parseIsoDate(i.through);
  // continuation: resume from MAX(due_date)+cadence if rows exist, else the anchor.
  let cursor = i.lastDue ? addDays(parseIsoDate(i.lastDue), i.cadenceDays) : parseIsoDate(i.anchor);
  const dues: string[] = [];
  let skipped = 0;
  let guard = 0;
  while (cursor.getTime() <= limit.getTime() && guard++ < 10000) {
    const dateIso = toIsoDate(cursor);
    if (i.existingDues.has(dateIso)) skipped++;
    else dues.push(dateIso);
    cursor = addDays(cursor, i.cadenceDays);
  }
  return { dues, skipped, unanchored: false };
}
