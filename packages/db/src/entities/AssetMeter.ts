// Entity: AssetMeter  ·  Owner module: equipment-maintenance
// A measurement point on an Asset (chiller horímetro, kWh, pool cloro/pH) with an optional min/max
// range that turns readings into a compliance guard (NOM-245/127). Back-ported from copafix.
import { boolean, numeric, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { auditColumns, orgId, pkUuid, tsNullable } from '../_shared.js';

export const assetMeters = pgTable('asset_meters', {
  id: pkUuid(),
  orgId: orgId(),
  assetId: uuid('asset_id').notNull(),             // → assets (intra-module)
  name: text('name').notNull(),
  meterType: text('meter_type').notNull(),         // Definition tipo_medidor
  unit: text('unit').notNull(),
  isCumulative: boolean('is_cumulative').notNull().default(false),
  minValue: numeric('min_value'),
  maxValue: numeric('max_value'),
  readingFrequency: text('reading_frequency'),     // Definition frecuencia_preset
  outOfRangeAction: text('out_of_range_action').notNull().default('crear_solicitud'), // Definition accion_fuera_de_rango
  correctiveTemplate: text('corrective_template'), // jsonb in SQL
  currentValue: numeric('current_value'),
  currentValueAt: tsNullable('current_value_at'),
  active: boolean('active').notNull().default(true),
  ...auditColumns,
});

export const assetMeterCreateSchema = z.object({
  assetId: z.string().uuid(),
  name: z.string().min(1),
  meterType: z.string(),
  unit: z.string().min(1),
  isCumulative: z.boolean().default(false),
  minValue: z.number().nullable().optional(),
  maxValue: z.number().nullable().optional(),
  readingFrequency: z.string().optional(),
  outOfRangeAction: z.string().default('crear_solicitud'),
});
export type AssetMeterCreate = z.infer<typeof assetMeterCreateSchema>;
