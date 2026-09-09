// equipment-maintenance machines (spec §2.1.1, §2.1.2) — pure, testable without a DB. Two small
// machines: the asset lifecycle (activo/inactivo/baja, the registration state) and the flat health
// audit (ok/alerta/crítico). Both are enforced server-side by their single writer capability.
// The pure evaluateRange (out-of-range/direction) lives here too so the contract suite covers it.
// Back-ported from copafix (packages/db/src/equipment-maintenance/transitions.ts); the only rewrite
// is defValues('<name>') → catalog.values('<name>') (the registry accessor form).
import { catalog } from '@astralitics/definitions';

// ── lifecycle: activo ⇄ inactivo → baja (terminal) ──────────────────────────────────────────────
export const ASSET_LIFECYCLE_TRANSITIONS: Record<string, readonly string[]> = {
  activo: ['inactivo', 'baja'],
  inactivo: ['activo', 'baja'],
  baja: [], // terminal — re-alta is a new asset row with a parent/lineage note
};

export function isLegalLifecycle(from: string, to: string): boolean {
  if (!(catalog.values('estado_registro_activo') as readonly string[]).includes(to)) return false;
  return (ASSET_LIFECYCLE_TRANSITIONS[from] ?? []).includes(to);
}

/** A `→ baja` retire requires the no-open-tasks guard (checked against scheduling at call time). */
export function isRetire(to: string): boolean {
  return to === 'baja';
}

// ── health: ok ⇄ alerta ⇄ crítico (flat, any direction; audited per change) ────────────────────
export function isHealth(value: string): boolean {
  return (catalog.values('estado_salud_equipo') as readonly string[]).includes(value);
}

/** crítico requires a note (and a supervisor notification) — the operator must say why. */
export function healthRequiresNote(value: string): boolean {
  return value === 'crítico' || value === 'alerta';
}

// ── range eval (pure) — used by recordMeterReading and sweep re-evaluations ─────────────────────
/** Pure range check (min/max/value) → { outOfRange, direction }. No db/ctx. */
export function evaluateRange(min: number | null, max: number | null, value: number): { outOfRange: boolean; direction: 'low' | 'high' | null } {
  if (min != null && value < min) return { outOfRange: true, direction: 'low' };
  if (max != null && value > max) return { outOfRange: true, direction: 'high' };
  return { outOfRange: false, direction: null };
}
