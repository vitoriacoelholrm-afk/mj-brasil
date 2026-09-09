// Function: logEvent (public) — the one sanctioned writer of the audit trail.
// Every module calls this rather than inserting audit rows itself. The actor string
// distinguishes human vs agent (mcp:) writes (§14.4).
import { auditEvents } from '@astralitics/entities';
import type { PgDatabase } from 'drizzle-orm/pg-core';

export interface AuditInput {
  orgId: string;
  actor: string;
  action: string;
  ownerType?: string | null;
  ownerId?: string | null;
  summary?: string | null;
  data?: unknown;
}

export async function logEvent(db: PgDatabase<any, any, any>, input: AuditInput): Promise<void> {
  if (!input.action) throw new Error('logEvent: action is required');
  await db.insert(auditEvents).values({
    orgId: input.orgId,
    actor: input.actor,
    action: input.action,
    ownerType: input.ownerType ?? null,
    ownerId: input.ownerId ?? null,
    summary: input.summary ?? null,
    data: (input.data ?? null) as any,
  });
}
