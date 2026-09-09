// Entity: ParLevel  ·  Owner module: materials-inventory
// Par (reorder) config per (material, stock location): one_par = units that constitute 1 PAR at this
// point; min_pars is the alarm threshold. material_id is intra-module; location_id is a soft ref.
// Back-ported from copafix (packages/db/src/materials-inventory/schema.ts).
import { boolean, numeric, pgTable, text, unique, uuid } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { auditColumns, orgId, pkUuid } from '../_shared.js';

export const parLevels = pgTable('par_levels', {
  id: pkUuid(),
  orgId: orgId(),
  materialId: uuid('material_id').notNull(),             // → materials (intra-module soft ref)
  locationId: uuid('location_id').notNull(),             // soft → locations
  onePar: numeric('one_par').notNull(),                  // units that constitute 1 PAR at this point
  targetPars: numeric('target_pars').notNull().default('1'),
  minPars: numeric('min_pars').notNull().default('1'),   // alarm threshold (ropería seeds 3)
  basisNote: text('basis_note'),                         // the par arithmetic, auditable
  active: boolean('active').notNull().default(true),
  ...auditColumns,
}, (t) => ({ parUq: unique('par_levels_org_material_location_uq').on(t.orgId, t.materialId, t.locationId) }));

export const parLevelCreateSchema = z.object({
  materialId: z.string().uuid(),
  locationId: z.string().uuid(),
  onePar: z.number().positive(),
  targetPars: z.number().positive().default(1),
  minPars: z.number().nonnegative().default(1),
  basisNote: z.string().optional(),
});
export type ParLevelCreate = z.infer<typeof parLevelCreateSchema>;
