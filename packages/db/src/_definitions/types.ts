// types.ts — the Definition primitive's mechanism (convergence kit Bundle 5; closes architecture-
// feedback G1/G23.1). A Definition is a canonical data term: name + type + the exact value-set, with
// an owning module. The G8 rule (reconciling ADR-06 additive-only with ADR-07 enums): a Definition
// declares the canonical value-set; the COLUMN stays open `text` (no pg enums — additive-friendly);
// enforcement is Zod-at-the-boundary here + a check:vocab CI gate, NOT the database. `open`
// Definitions are org-editable (extension rows allowed beyond the seeded set) so they validate as a
// non-empty string rather than a closed enum. Reference shape: copafix packages/db/src/_vocabulary.ts.
import { z } from 'zod';

export type DefinitionType = 'status' | 'kind' | 'reason' | 'catalogo';

export interface Definition {
  type: DefinitionType;
  values: readonly string[];
  owner: string;       // owning module (e.g. 'control-plane', 'compliance-certifications', '_chassis')
  open?: boolean;      // org-editable (extension values allowed beyond the seeded set)
  note?: string;
}

/** A Zod validator for a Definition's canonical value-set — the boundary check. A closed Definition
 *  validates as an enum; an `open` one accepts extension values too (org-editable), so it validates as
 *  a non-empty string. (Identical semantics to copafix's defSchema, generalized to any Definition.) */
export function defSchema(def: Definition) {
  if (def.open) return z.string().min(1);
  return z.enum(def.values as unknown as [string, ...string[]]);
}

/** The canonical value-set of a Definition. */
export function defValues(def: Definition): readonly string[] {
  return def.values;
}

export interface DefinitionRegistry<R extends Record<string, Definition>> {
  defs: R;
  names(): (keyof R)[];
  get(name: keyof R): Definition;
  schema(name: keyof R): ReturnType<typeof defSchema>;
  values(name: keyof R): readonly string[];
  /** Every Definition owned by `module` — how a module reads back its own value-sets. */
  byOwner(module: string): (keyof R)[];
}

/** Build a registry over a set of Definitions. This is the "home" a module references: it registers
 *  its Definitions and reads back the boundary schema/values for each by name. */
export function createRegistry<R extends Record<string, Definition>>(defs: R): DefinitionRegistry<R> {
  return {
    defs,
    names: () => Object.keys(defs) as (keyof R)[],
    get: (name) => defs[name],
    schema: (name) => defSchema(defs[name]),
    values: (name) => defs[name].values,
    byOwner: (module) => (Object.keys(defs) as (keyof R)[]).filter((n) => defs[n].owner === module),
  };
}
