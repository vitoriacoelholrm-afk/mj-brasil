// Entity: MaintenanceOrderDetail  ·  Owner module: equipment-maintenance
// The OT (orden de trabajo) facet (spec §2.4): a satellite 1:1 on a scheduling-field-service Task.
// The Task owns the lifecycle (G11 "shared lifecycle, satellite facets"); this row carries only what
// maintenance knows — which asset, which trade, which failure, the diagnosis, and the cost breakdown.
// Created via createMaintenanceOrder (Task + satellite atomic), closed via completeMaintenanceOrder.
// task_id and all cross-module refs are SOFT uuids — no FK (§6). Back-ported from copafix.
import { integer, pgTable, text, unique, uuid } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { auditColumns, money, orgId, pkUuid } from '../_shared.js';

export const maintenanceOrderDetails = pgTable('maintenance_order_details', {
  id: pkUuid(),
  orgId: orgId(),
  taskId: uuid('task_id').notNull(),                       // soft → scheduling-field-service.tasks; 1:1
  assetId: uuid('asset_id'),                               // soft → assets (null for a space-only OT)
  locationRef: uuid('location_ref'),                       // soft → facility-spaces.locations
  trade: text('trade'),                                    // Definition oficio
  source: text('source').notNull().default('manual'),      // Definition origen_ot
  requestId: uuid('request_id'),                           // soft → request-intake.requests
  failureCodeId: uuid('failure_code_id'),                  // soft → request-intake.catalogo_fallas
  diagnosis: text('diagnosis'),
  rootCause: text('root_cause'),
  laborMinutes: integer('labor_minutes'),
  partsCost: money('parts_cost'),                          // numeric(18,4)
  externalCost: money('external_cost'),                    // numeric(18,4)
  currencyCode: text('currency_code').notNull().default('MXN'),
  vendorServiceOrderId: uuid('vendor_service_order_id'),   // soft → vendor-management.vendor_service_orders
  meterReadingId: uuid('meter_reading_id'),                // soft → meter_readings (source=lectura)
  checklistItemRef: text('checklist_item_ref'),            // stable id of the failed checklist item
  completedSummary: text('completed_summary'),
  completeIdempotencyKey: text('complete_idempotency_key'), // offline command replay (completeMaintenanceOrder)
  ...auditColumns,
}, (t) => ({ taskUq: unique('maintenance_order_details_org_task_uq').on(t.orgId, t.taskId) }));

export const maintenanceOrderDetailCreateSchema = z.object({
  taskId: z.string().uuid(),
  assetId: z.string().uuid().optional(),
  locationRef: z.string().uuid().optional(),
  trade: z.string().optional(),                            // Definition oficio
  source: z.string().default('manual'),                   // Definition origen_ot
  requestId: z.string().uuid().optional(),
  failureCodeId: z.string().uuid().optional(),
  vendorServiceOrderId: z.string().uuid().optional(),
  meterReadingId: z.string().uuid().optional(),
  checklistItemRef: z.string().optional(),
});
export type MaintenanceOrderDetailCreate = z.infer<typeof maintenanceOrderDetailCreateSchema>;
