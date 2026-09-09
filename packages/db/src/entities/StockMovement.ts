// Entity: StockMovement  ·  Owner module: materials-inventory
// The append-only signed ledger (never UPDATE/DELETE): corrections are compensating rows
// (reverses_movement_id). qty_delta is signed (+ into a location, − out). idempotency_key makes the
// offline command replay-safe (D3). Cross-module refs (location, task, document) are SOFT uuids.
// Back-ported from copafix (packages/db/src/materials-inventory/schema.ts).
import { numeric, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { auditColumns, orgId, pkUuid, tsNow } from '../_shared.js';

export const stockMovements = pgTable('stock_movements', {
  id: pkUuid(),
  orgId: orgId(),
  materialId: uuid('material_id').notNull(),             // → materials (intra-module soft ref)
  lotId: uuid('lot_id'),                                 // → material_lots; required if lot_tracked & decrementing
  kind: text('kind').notNull(),                          // Definition movement_kind
  qtyDelta: numeric('qty_delta').notNull(),              // signed: + into location, − out
  uom: text('uom').notNull(),                            // snapshot of material.unit_of_measure
  locationId: uuid('location_id').notNull(),             // soft → locations (the stock point)
  taskId: uuid('task_id'),                               // soft → tasks; only kind=consumo
  transferGroupId: uuid('transfer_group_id'),            // ties the ± pair of a transferencia
  reversesMovementId: uuid('reverses_movement_id'),      // soft self-ref; a movement is reversed once
  countBatchId: uuid('count_batch_id'),                  // groups a monthlyCount's ajustes
  bajaReason: text('baja_reason'),                       // Definition baja_reason (required if kind=baja)
  unitCost: numeric('unit_cost'),                        // snapshot: lot cost or default_unit_cost
  currencyCode: text('currency_code').default('MXN'),
  doseNote: text('dose_note'),                           // químico mix applied (Rondo doseBasis)
  documentId: uuid('document_id'),                       // soft → Document
  movedAt: tsNow('moved_at'),                            // business moment (may be past — offline drain)
  movedBy: uuid('moved_by'),                             // soft → membership
  note: text('note'),
  idempotencyKey: text('idempotency_key'),               // offline command dedupe (D3)
  ...auditColumns,
});

export const stockMovementCreateSchema = z.object({
  materialId: z.string().uuid(),
  lotId: z.string().uuid().optional(),
  kind: z.string(),                                      // Definition movement_kind
  qtyDelta: z.number(),
  uom: z.string(),
  locationId: z.string().uuid(),
  taskId: z.string().uuid().optional(),
  bajaReason: z.string().optional(),                     // Definition baja_reason
  unitCost: z.number().nullable().optional(),
  note: z.string().optional(),
  idempotencyKey: z.string().optional(),
});
export type StockMovementCreate = z.infer<typeof stockMovementCreateSchema>;
