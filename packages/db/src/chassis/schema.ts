// Chassis infrastructure tables (spec _chassis.md §2). These are real org-scoped tables
// (org_id + auditColumns + pkUuid + RLS FORCE like any entity) — the substrate the offline
// outbox/drainer and idempotency layer write to. Domain module tables splice into schema.ts
// at __MODULE_SCHEMA_EXPORTS__; these chassis tables are always present.
import { pgTable, uuid, text, jsonb, timestamp, unique } from 'drizzle-orm/pg-core';
import { pkUuid, orgId, tsNow, tsNull, auditColumns } from '../_shared.js';

/** sync_exceptions — an offline command rejected by a server-side guard becomes a row here,
 *  in the same tx that rejects it. "Surface, don't auto-merge." (§2.1) */
export const syncExceptions = pgTable(
  'sync_exceptions',
  {
    id: pkUuid(),
    orgId: orgId(),
    commandId: uuid('command_id').notNull(), // = idempotency key
    commandType: text('command_type').notNull(), // canonical <module>.<Function> (§1.4)
    payload: jsonb('payload').notNull(),
    membershipId: uuid('membership_id'),
    clientTs: timestamp('client_ts', { withTimezone: true }).notNull(),
    entityRef: jsonb('entity_ref'), // { type, id } polymorphic pointer for the drawer deep-link
    reasonCode: text('reason_code').notNull(), // Definition sync_exception_reason
    reasonDetail: text('reason_detail'),
    status: text('status').notNull().default('open'), // Definition sync_exception_status
    resolutionNote: text('resolution_note'),
    resolvedBy: uuid('resolved_by'),
    resolvedAt: tsNull('resolved_at'),
    ...auditColumns,
  },
  (t) => ({ uqCommand: unique('sync_exceptions_org_command_uq').on(t.orgId, t.commandId) }),
);

/** idempotency_keys — dedupe of drainer replays (ADR-12 made code). (§2.2) */
export const idempotencyKeys = pgTable(
  'idempotency_keys',
  {
    id: pkUuid(),
    orgId: orgId(),
    key: uuid('key').notNull(), // = outbox command id
    commandType: text('command_type').notNull(),
    requestHash: text('request_hash').notNull(), // sha256 of payload; same key + diff payload => reject
    status: text('status').notNull().default('in_flight'), // Definition idempotency_status
    response: jsonb('response'),
    firstSeenAt: tsNow('first_seen_at'),
    completedAt: tsNull('completed_at'),
    ...auditColumns,
  },
  (t) => ({ uqKey: unique('idempotency_keys_org_key_uq').on(t.orgId, t.key) }),
);
