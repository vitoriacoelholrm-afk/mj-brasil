// materials-inventory machines + pure helpers (spec §2.2.1) — testable without a DB. The lot_status
// lifecycle (Rondo verbatim): active⇄depleted are AUTOMATIC (driven by applyLotDelta — qty-on-hand
// hitting zero / a reverse reviving it); the rest are manual (expired sweep, recall, disposal).
// Back-ported from copafix (packages/db/src/materials-inventory/transitions.ts); the only re-point is
// defValues(NAME) → catalog.values(NAME) (the definitions registry, a legal hard import).
import { catalog } from '@astralitics/definitions';

// Manual aristas only — depleted⇄active are exclusive to the internal engine (applyLotDelta).
export const LOT_TRANSITIONS: Record<string, readonly string[]> = {
  active: ['expired', 'recalled'],          // (+ depleted, automatic)
  depleted: [],                             // (+ active, automatic revive)
  expired: ['disposed'],
  recalled: ['disposed'],
  disposed: [],                            // terminal absolute
};
export function isLegalLot(from: string, to: string): boolean {
  if (!(catalog.values('lot_status') as readonly string[]).includes(to)) return false;
  return (LOT_TRANSITIONS[from] ?? []).includes(to);
}

/** Sign coherence between a movement kind and its qty_delta (Zod boundary guard, spec §2.3). */
export function signOkForKind(kind: string, qtyDelta: number): boolean {
  switch (kind) {
    case 'recepcion': return qtyDelta > 0;
    case 'consumo': return qtyDelta < 0;
    case 'baja': return qtyDelta < 0;
    case 'transferencia': return qtyDelta !== 0; // the ± pair is validated together
    case 'ajuste': return qtyDelta !== 0;
    case 'devolucion': return qtyDelta !== 0;
    default: return false;
  }
}

/** Does this movement kind decrement a lot's regulatory counter (→ lot_id required when lot-tracked)? */
export function decrementsLot(kind: string): boolean {
  return kind === 'consumo' || kind === 'baja';
}

/** Pure: given a lot's current on-hand and a delta, the resulting on-hand + the auto status flip. */
export function applyLotMath(currentOnHand: number, delta: number, currentStatus: string): { onHand: number; status: string } {
  const onHand = currentOnHand + delta;
  let status = currentStatus;
  if (currentStatus === 'active' && onHand <= 0) status = 'depleted';   // auto-deplete at zero
  else if (currentStatus === 'depleted' && onHand > 0) status = 'active'; // auto-revive on reverse
  return { onHand, status };
}
