// Entity: ScheduleRuleItem  ·  Owner module: scheduling-field-service
// The polymorphic scope of a ScheduleRule (generalizes Rondo contract_items): one row per
// location-or-asset the rule applies to, with optional per-item cadence/anchor/payload overrides.
// Exactly-one-of location/asset is enforced in the Function (upsertScheduleRule), NOT the DB.
// archivedAt drives declarative item reconciliation. Back-ported from copafix.
import { integer, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { auditColumns, orgId, pkUuid, tsNullable } from '../_shared.js';

export const scheduleRuleItems = pgTable('schedule_rule_items', {
  id: pkUuid(),
  orgId: orgId(),
  ruleId: uuid('rule_id').notNull(),                       // soft → schedule_rules (intra-module; no FK §6)
  targetKind: text('target_kind').notNull(),              // Definition target_kind
  locationId: uuid('location_id'),                        // soft → facility-spaces.locations
  assetId: uuid('asset_id'),                              // soft → equipment-maintenance.assets
  frequencyDaysOverride: integer('frequency_days_override'),
  anchorDate: text('anchor_date'),                        // ISO date
  payloadOverride: text('payload_override'),              // jsonb in SQL (nullable)
  archivedAt: tsNullable('archived_at'),
  ...auditColumns,
});

export const scheduleRuleItemCreateSchema = z.object({
  ruleId: z.string().uuid(),
  targetKind: z.string(),                                 // Definition target_kind
  locationId: z.string().uuid().optional(),
  assetId: z.string().uuid().optional(),
  frequencyDaysOverride: z.number().int().optional(),
  anchorDate: z.string().optional(),
  payloadOverride: z.record(z.unknown()).optional(),
});
export type ScheduleRuleItemCreate = z.infer<typeof scheduleRuleItemCreateSchema>;
