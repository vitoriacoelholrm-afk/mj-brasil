// Entity: MeterReading  ·  Owner module: equipment-maintenance
// Append-only meter readings (never update/delete; a correction is a new row via
// supersedes_reading_id). out_of_range is stamped at insert against the meter's range; an
// idempotency_key makes the offline reading command replay-safe (D3). Back-ported from copafix.
import { boolean, numeric, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { auditColumns, orgId, pkUuid, tsNow } from '../_shared.js';

export const meterReadings = pgTable('meter_readings', {
  id: pkUuid(),
  orgId: orgId(),
  meterId: uuid('meter_id').notNull(),             // → asset_meters
  value: numeric('value').notNull(),
  readAt: tsNow('read_at'),
  readBy: uuid('read_by'),                         // soft → identity-access.memberships
  source: text('source').notNull().default('manual'), // Definition fuente_lectura
  note: text('note'),
  photoDocumentId: uuid('photo_document_id'),      // soft → platform-core.documents
  outOfRange: boolean('out_of_range').notNull().default(false),
  triggeredRequestId: uuid('triggered_request_id'),
  triggeredTaskId: uuid('triggered_task_id'),
  supersedesReadingId: uuid('supersedes_reading_id'),
  idempotencyKey: text('idempotency_key'),         // unique partial (org_id, idempotency_key)
  ...auditColumns,
});

export const meterReadingCreateSchema = z.object({
  meterId: z.string().uuid(),
  value: z.number(),
  readAt: z.union([z.string(), z.date()]).optional(),
  source: z.string().default('manual'),
  note: z.string().optional(),
  photoDocumentId: z.string().uuid().optional(),
  idempotencyKey: z.string().min(1).optional(),
});
export type MeterReadingCreate = z.infer<typeof meterReadingCreateSchema>;
