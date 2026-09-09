// Entity: MaterialLot  ·  Owner module: materials-inventory
// Lot/expiry tracking (Rondo verbatim): qty_received is immutable; qty_on_hand is the running counter
// written ONLY by applyLotDelta; status is the lot_status machine (active⇄depleted automatic, the rest
// manual). material_id is an intra-module soft ref (no FK). Back-ported from copafix
// (packages/db/src/materials-inventory/schema.ts).
import { numeric, pgTable, text, unique, uuid } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { auditColumns, orgId, pkUuid } from '../_shared.js';

export const materialLots = pgTable('material_lots', {
  id: pkUuid(),
  orgId: orgId(),
  materialId: uuid('material_id').notNull(),             // → materials (intra-module soft ref)
  lotNumber: text('lot_number').notNull(),               // unique (org_id, material_id, lot_number)
  receivedAt: text('received_at').notNull(),             // ISO date
  expiresAt: text('expires_at'),                         // ISO date; indexed for the ≤90d sweep
  qtyReceived: numeric('qty_received').notNull(),        // immutable
  qtyOnHand: numeric('qty_on_hand').notNull(),           // running; written ONLY by applyLotDelta
  unitCost: numeric('unit_cost'),                        // cost of this receipt
  currencyCode: text('currency_code').notNull().default('MXN'),
  vendorId: uuid('vendor_id'),                           // soft → vendors
  receivedLocationId: uuid('received_location_id'),      // soft → locations
  status: text('status').notNull().default('active'),    // Definition lot_status
  disposalNote: text('disposal_note'),
  disposalDocumentId: uuid('disposal_document_id'),
  ...auditColumns,
}, (t) => ({ lotUq: unique('material_lots_org_material_lot_uq').on(t.orgId, t.materialId, t.lotNumber) }));

export const materialLotCreateSchema = z.object({
  materialId: z.string().uuid(),
  lotNumber: z.string().min(1),
  receivedAt: z.string(),
  expiresAt: z.string().optional(),
  qtyReceived: z.number().positive(),
  unitCost: z.number().nonnegative().nullable().optional(),
  vendorId: z.string().uuid().optional(),
  receivedLocationId: z.string().uuid().optional(),
});
export type MaterialLotCreate = z.infer<typeof materialLotCreateSchema>;
