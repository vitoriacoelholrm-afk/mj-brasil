// Entity: AuditEvent  ·  Owner module: platform-core
// The append-only business audit trail (who-did-what-to-which-record). The chassis
// provides a raw audit sink; platform-core adds the semantics + viewing UI on top.
// INSERT-only at the DB layer in real deployments (§14.4).
import { jsonb, pgTable, text } from 'drizzle-orm/pg-core';
import { orgId, pkUuid, tsNow } from '../_shared.js';

export const auditEvents = pgTable('audit_events', {
  id: pkUuid(),
  orgId: orgId(),
  at: tsNow('at'),
  // distinguishes human vs agent-originated writes: "member:<id>" | "mcp:<principal>:<session>" | "app"
  actor: text('actor').notNull(),
  action: text('action').notNull(), // e.g. "invoice.created"
  ownerType: text('owner_type'),
  ownerId: text('owner_id'),
  summary: text('summary'),
  data: jsonb('data'),
});
