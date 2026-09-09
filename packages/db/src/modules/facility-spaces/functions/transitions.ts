// The room-status transition machine (facility-spaces spec §2.2) — pure, testable without a DB,
// the single source of truth applyStatusTransition enforces server-side. Rendering the legal-only
// transitions in the UI comes from the same map (an illegal transition can't be requested).
import { catalog } from '@astralitics/definitions';

/** from → allowed `to` statuses. Genesis (from = null) is seed/import only and allows any. */
export const SPACE_STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  Lista: ['O', 'OL', 'VS'],
  O: ['OL', 'OS', 'S', 'FNM', 'OSE', 'OND'],
  OL: ['OS', 'S', 'FNM', 'OSE', 'OND'],
  OS: ['OL', 'S', 'FNM'],
  FNM: ['OS', 'OL', 'S'],
  OSE: ['O', 'OS', 'S', 'VS'],
  OND: ['O', 'OS', 'S', 'VS'],
  S: ['VS', 'VL'],
  VS: ['VL'],
  VL: ['Lista', 'VS'],
};

// Cleanliness rank for the down-rank guard (R4). Only the "ready axis" statuses are ranked.
const RANK: Record<string, number> = { VS: 0, VL: 1, Lista: 2 };
export const cleanlinessRank = (s: string | null | undefined): number | undefined => (s == null ? undefined : RANK[s]);

/** A transition LOWERS cleanliness rank (Lista→VS, VL→VS) — requires a reason_code (R4). */
export function isDownRank(from: string | null | undefined, to: string): boolean {
  const a = cleanlinessRank(from), b = cleanlinessRank(to);
  return a !== undefined && b !== undefined && b < a;
}

/** Is `to` a legal status at all? (value-set guard, before the from→to map.) */
export function isStatus(to: string): boolean {
  return (catalog.values('space_status') as readonly string[]).includes(to);
}

/** Legal from→to per the map. `from === null` = genesis (seed/import) → any legal status. */
export function isLegalTransition(from: string | null, to: string): boolean {
  if (!isStatus(to)) return false;
  if (from === null) return true;
  return (SPACE_STATUS_TRANSITIONS[from] ?? []).includes(to);
}

/** The legal next statuses from `from` — what the UI renders as tappable. */
export function legalNext(from: string | null): readonly string[] {
  return from === null ? (catalog.values('space_status') as readonly string[]) : (SPACE_STATUS_TRANSITIONS[from] ?? []);
}

// ── Occupancy rollup (the "estado de la casa" KPI) ────────────────────────────────────────────
// The occupied axis (a guest is in the room) vs the vacant/sellable axis. FU (blocked) is neither —
// it's out of inventory. Pure, so the KPI is testable without a DB and shared by dashboard + Home.
export const OCCUPIED_STATUSES = ['O', 'OL', 'OS', 'S', 'FNM', 'OSE', 'OND'] as const;
export const AVAILABLE_STATUSES = ['VS', 'VL', 'Lista'] as const;

export interface OccupancySummary {
  totalRooms: number;
  ocupadas: number;
  disponibles: number;
  fueraDeUso: number;  // FU — blocked / out of use, not sellable inventory
  sinEstado: number;   // no status yet (pre-genesis)
  vendibles: number;   // total − fuera de uso (the denominator for occupancy)
  ocupacionPct: number | null; // ocupadas / vendibles, 0–100 (null when no sellable rooms)
}

/** Roll a getCurrentHouse `totals` map (status | 'FU' | 'sin_estado' → count) into the house KPI. */
export function occupancyFromTotals(totals: Record<string, number>): OccupancySummary {
  const sum = (keys: readonly string[]) => keys.reduce((s, k) => s + (totals[k] ?? 0), 0);
  const ocupadas = sum(OCCUPIED_STATUSES);
  const disponibles = sum(AVAILABLE_STATUSES);
  const fueraDeUso = totals['FU'] ?? 0;
  const sinEstado = totals['sin_estado'] ?? 0;
  const totalRooms = Object.values(totals).reduce((s, n) => s + n, 0);
  const vendibles = totalRooms - fueraDeUso;
  const ocupacionPct = vendibles > 0 ? Math.round((ocupadas / vendibles) * 1000) / 10 : null;
  return { totalRooms, ocupadas, disponibles, fueraDeUso, sinEstado, vendibles, ocupacionPct };
}
