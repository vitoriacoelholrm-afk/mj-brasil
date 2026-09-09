// Entity: Material  ·  Owner module: materials-inventory
// The stock-item catalog (refacciones/químicos/insumos/blancos) — the Rondo materials pattern. Real
// cost rides the lot/movement, not this row (default_unit_cost is a reference only). Cross-module refs
// (compatible assets, preferred vendor, SDS/photo Documents) are SOFT uuids. Back-ported from copafix
// (packages/db/src/materials-inventory/schema.ts).
import { boolean, numeric, pgTable, text, unique, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { auditColumns, orgId, pkUuid, tsNullable } from '../_shared.js';

export const materials = pgTable('materials', {
  id: pkUuid(),
  orgId: orgId(),
  code: text('code').notNull(),                          // SKU MAT-… ; unique (org_id, code)
  name: text('name').notNull(),
  kind: text('kind').notNull(),                          // Definition material_kind
  category: text('category'),                            // Definition material_categoria (open)
  unitOfMeasure: text('unit_of_measure').notNull().default('pieza'), // Definition unidad_medida
  lotTracked: boolean('lot_tracked').notNull().default(false), // immutable once movements exist (guard)
  brand: text('brand'),
  partNumber: text('part_number'),                       // manufacturer part number (refacciones)
  compatibleAssetIds: uuid('compatible_asset_ids').array().notNull().default(sql`'{}'`), // soft → assets (GIN)
  compatibilityNote: text('compatibility_note'),
  preferredVendorId: uuid('preferred_vendor_id'),        // soft → vendors
  defaultUnitCost: numeric('default_unit_cost'),         // reference cost; real cost rides the lot/movement
  currencyCode: text('currency_code').notNull().default('MXN'),
  hazardClass: text('hazard_class'),                     // químico only
  sdsDocumentId: uuid('sds_document_id'),                // soft → Document
  dosageNote: text('dosage_note'),                       // químico only
  photoDocumentId: uuid('photo_document_id'),
  specs: text('specs').notNull().default('{}'),          // jsonb-as-text extras per kind
  notes: text('notes'),
  archivedAt: tsNullable('archived_at'),                 // soft retire
  ...auditColumns,
}, (t) => ({ codeUq: unique('materials_org_code_uq').on(t.orgId, t.code) }));

export const materialCreateSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  kind: z.string(),                                      // validated against Definition material_kind at the boundary
  category: z.string().optional(),                       // Definition material_categoria
  unitOfMeasure: z.string().default('pieza'),            // Definition unidad_medida
  lotTracked: z.boolean().optional(),
  brand: z.string().optional(),
  partNumber: z.string().optional(),
  compatibleAssetIds: z.array(z.string().uuid()).default([]),
  compatibilityNote: z.string().optional(),
  preferredVendorId: z.string().uuid().optional(),
  defaultUnitCost: z.number().nonnegative().nullable().optional(),
  hazardClass: z.string().optional(),
  dosageNote: z.string().optional(),
  notes: z.string().optional(),
});
export type MaterialCreate = z.infer<typeof materialCreateSchema>;
