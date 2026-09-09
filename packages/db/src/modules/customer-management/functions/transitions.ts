// customer-management machines + pure helpers — testable without a DB (the contract-test surface).
// THE Customer lifecycle (Definition customer_status). A customer is active (billable/serviceable) or
// inactive (churned/dormant) and can come back — a simple two-state machine, no terminal. The column
// stays open text; the Definition declares the value-set; enforcement is the legal-transition check
// here + Zod at the boundary (CONVENTIONS.md §3). Ported from Rondo.
import { catalog } from '@astralitics/definitions';

export const CUSTOMER_TRANSITIONS: Record<string, readonly string[]> = {
  active: ['inactive'],
  inactive: ['active'],
};

export function isLegalCustomerTransition(from: string, to: string): boolean {
  if (!(catalog.values('customer_status') as readonly string[]).includes(to)) return false;
  return (CUSTOMER_TRANSITIONS[from] ?? []).includes(to);
}
