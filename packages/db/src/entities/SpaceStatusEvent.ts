// Entity: SpaceStatusEvent  ·  Owner module: facility-spaces
// The append-only source of truth for room status (never UPDATE/DELETE; the Location read-model is the
// only thing mutated). Each row is one applied transition; idempotency_key makes the offline outbox
// replay-safe and prev_event_id is the staleness precondition (R3) that stops a stale offline write
// from regressing an inspected room (D3). Cross-module refs (task_id, block_id, actor_membership_id)
// are SOFT uuids — no FK (§6). Back-ported from copafix (packages/db/src/facility-spaces/schema.ts).
import { pgTable, text, unique, uuid } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { auditColumns, orgId, pkUuid, tsNullable } from '../_shared.js';

export const spaceStatusEvents = pgTable('space_status_events', {
  id: pkUuid(),
  orgId: orgId(),
  locationId: uuid('location_id').notNull(),        // → locations (always kind=room)
  fromStatus: text('from_status'),                  // Definition space_status (null at genesis)
  toStatus: text('to_status').notNull(),            // Definition space_status
  source: text('source').notNull(),                 // Definition status_event_source
  reasonCode: text('reason_code'),                  // Definition status_reason (required on down-rank, R4)
  note: text('note'),
  taskId: uuid('task_id'),                           // soft → scheduling-field-service.tasks
  blockId: uuid('block_id'),                         // soft → future facility-spaces.space_blocks
  occupancyInputId: uuid('occupancy_input_id'),      // soft → future facility-spaces.occupancy_inputs
  actorMembershipId: uuid('actor_membership_id'),    // soft → identity-access.memberships
  clientTs: tsNullable('client_ts'),                 // device time (offline outbox); created_at = server time
  idempotencyKey: text('idempotency_key').notNull(), // unique (org_id, idempotency_key)
  prevEventId: uuid('prev_event_id'),                // head the client saw when enqueuing (staleness precondition)
  ...auditColumns,
}, (t) => ({ idemUq: unique('space_status_events_org_idem_uq').on(t.orgId, t.idempotencyKey) }));

export const spaceStatusEventCreateSchema = z.object({
  locationId: z.string().uuid(),
  fromStatus: z.string().nullable().optional(),     // Definition space_status
  toStatus: z.string(),                             // Definition space_status
  source: z.string(),                               // Definition status_event_source
  reasonCode: z.string().optional(),               // Definition status_reason
  note: z.string().max(2000).optional(),
  taskId: z.string().uuid().optional(),
  blockId: z.string().uuid().optional(),
  occupancyInputId: z.string().uuid().optional(),
  actorMembershipId: z.string().uuid().optional(),
  clientTs: z.union([z.string(), z.date()]).optional(),
  idempotencyKey: z.string().min(1),
  prevEventId: z.string().uuid().optional(),
});
export type SpaceStatusEventCreate = z.infer<typeof spaceStatusEventCreateSchema>;
