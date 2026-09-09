// Entity: Asset  ·  Owner module: equipment-maintenance
// Every maintainable physical thing: central plant, per-room equipment, or a child component
// (a soft self-ref tree). Generalizes the hotel demo's `equipos` (vocabulary kept verbatim) +
// PETfactory `assets`. Cross-module refs (location_id, vendor_id) are SOFT uuids — no FK (§6).
// Back-ported from copafix (packages/db/src/equipment-maintenance/schema.ts), the first round-trip.
import { pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { auditColumns, orgId, pkUuid, tsNullable } from '../_shared.js';

export const assets = pgTable('assets', {
  id: pkUuid(),
  orgId: orgId(),
  parentAssetId: uuid('parent_asset_id'),          // soft self-ref → tree
  code: text('code').notNull(),                    // EQ-001… (QR anchor); unique (org_id, code)
  name: text('name').notNull(),
  kind: text('kind').notNull().default('equipo'),  // Definition tipo_activo
  area: text('area').notNull(),                    // Definition area_operativa (owner facility-spaces)
  locationId: uuid('location_id'),                 // soft → facility-spaces.locations
  criticality: text('criticality').notNull().default('Estándar'),  // Definition prioridad_equipo
  healthStatus: text('health_status').notNull().default('ok'),     // Definition estado_salud_equipo
  healthNote: text('health_note'),
  lifecycleStatus: text('lifecycle_status').notNull().default('activo'), // Definition estado_registro_activo
  brand: text('brand'),
  model: text('model'),
  serialNumber: text('serial_number'),
  vendorId: uuid('vendor_id'),                     // soft → vendor-management.vendors
  vendorContact: text('vendor_contact'),
  purchaseDate: text('purchase_date'),             // date (no time component)
  warrantyExpiresAt: text('warranty_expires_at'),
  warrantyNotes: text('warranty_notes'),
  pmFrequencies: text('pm_frequencies').array().notNull().default([]), // Definition frecuencia_preset[]
  lastMaintenanceAt: tsNullable('last_maintenance_at'),
  specs: text('specs').notNull().default('{}'),    // jsonb in SQL
  qrToken: text('qr_token').notNull(),             // unique (org_id, qr_token)
  notes: text('notes'),
  retiredAt: tsNullable('retired_at'),
  ...auditColumns,
});

export const assetCreateSchema = z.object({
  code: z.string().min(1).max(64),
  name: z.string().min(1),
  kind: z.string().default('equipo'),              // validated against Definition tipo_activo at the boundary
  area: z.string(),                                // Definition area_operativa
  parentAssetId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  criticality: z.string().default('Estándar'),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  vendorId: z.string().uuid().optional(),
  vendorContact: z.string().optional(),
  purchaseDate: z.string().optional(),
  warrantyExpiresAt: z.string().optional(),
  warrantyNotes: z.string().optional(),
  pmFrequencies: z.array(z.string()).default([]),
  specs: z.record(z.unknown()).default({}),
  notes: z.string().optional(),
});
export type AssetCreate = z.infer<typeof assetCreateSchema>;
