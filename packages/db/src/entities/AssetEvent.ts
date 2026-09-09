// Entity: AssetEvent  ·  Owner module: equipment-maintenance
// The user-facing per-asset timeline (Beamy pattern), distinct from platform-core's forensic audit.
// Append-only; carries an optional cost + a track_in_finance hook to the finance rollup.
// Back-ported from copafix.
import { boolean, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { auditColumns, money, orgId, pkUuid, tsNow } from '../_shared.js';

export const assetEvents = pgTable('asset_events', {
  id: pkUuid(),
  orgId: orgId(),
  assetId: uuid('asset_id').notNull(),             // → assets
  eventType: text('event_type').notNull(),         // Definition tipo_evento_activo
  at: tsNow('at'),
  actor: text('actor').notNull(),                  // member:<id> | app | mcp:…
  note: text('note'),
  cost: money('cost'),
  currencyCode: text('currency_code'),
  vendorId: uuid('vendor_id'),                     // soft → vendor-management.vendors
  taskId: uuid('task_id'),                         // soft → scheduling-field-service.tasks
  documentId: uuid('document_id'),                 // soft → platform-core.documents
  trackInFinance: boolean('track_in_finance').notNull().default(false),
  ...auditColumns,
});

export const assetEventCreateSchema = z.object({
  assetId: z.string().uuid(),
  eventType: z.string(),
  note: z.string().optional(),
  cost: z.number().nullable().optional(),
  currencyCode: z.string().default('MXN').optional(),
  vendorId: z.string().uuid().optional(),
  documentId: z.string().uuid().optional(),
  trackInFinance: z.boolean().default(false),
});
export type AssetEventCreate = z.infer<typeof assetEventCreateSchema>;
