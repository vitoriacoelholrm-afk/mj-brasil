// Entity: Location  ·  Owner module: facility-spaces
// The physical tree (property > floor > room/area) — a soft self-ref via parent_id. For rooms it is
// also a thin read-model cache over the append-only space_status_events log: current_status /
// current_status_event_id / current_block_id are written ONLY by applyStatusTransition. Other modules
// reference a Location by SOFT uuid (no FK) and resolve a label via getLocation (G9). Back-ported
// from copafix (packages/db/src/facility-spaces/schema.ts).
import { boolean, integer, pgTable, text, unique, uuid } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { auditColumns, orgId, pkUuid } from '../_shared.js';

export const locations = pgTable('locations', {
  id: pkUuid(),
  orgId: orgId(),
  kind: text('kind').notNull().default('room'),    // Definition location_kind
  parentId: uuid('parent_id'),                      // soft self-ref → locations (tree, NO FK)
  code: text('code').notNull(),                     // unique (org_id, code)
  name: text('name').notNull(),
  floorNumber: integer('floor_number'),
  roomType: text('room_type'),                      // Definition room_type (rooms only)
  fachadaZone: text('fachada_zone'),                // Definition fachada_zone (rooms only)
  areaCategoria: text('area_categoria'),            // Definition area_operativa (areas only)
  qrToken: text('qr_token'),                        // unique partial (org_id, qr_token)
  currentStatus: text('current_status'),            // Definition space_status (read model, rooms only)
  currentStatusEventId: uuid('current_status_event_id'), // head of the event log (optimistic precondition)
  currentBlockId: uuid('current_block_id'),         // soft → future facility-spaces.space_blocks (FU overlay)
  attributes: text('attributes').notNull().default('{}'), // jsonb in SQL
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order'),
  ...auditColumns,
}, (t) => ({ codeUq: unique('locations_org_code_uq').on(t.orgId, t.code) }));

export const locationCreateSchema = z.object({
  kind: z.string().default('room'),                 // validated against Definition location_kind at the boundary
  parentId: z.string().uuid().optional(),
  code: z.string().min(1).max(64),
  name: z.string().min(1),
  floorNumber: z.number().int().nullable().optional(),
  roomType: z.string().optional(),                  // Definition room_type
  fachadaZone: z.string().optional(),               // Definition fachada_zone
  areaCategoria: z.string().optional(),             // Definition area_operativa
  qrToken: z.string().optional(),
  attributes: z.record(z.unknown()).default({}),
  sortOrder: z.number().int().nullable().optional(),
});
export type LocationCreate = z.infer<typeof locationCreateSchema>;
