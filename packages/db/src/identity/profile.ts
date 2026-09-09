// getMembershipProfile — the "who am I" read model (identity-access). Returns the resolved Context
// spine plus the member's display name/email, so the client can pick the right layout (field roles
// → mobile; admin/executive → desktop sidebar) and greet the user. Runs under the RLS-scoped tx.
import { sql } from 'drizzle-orm';
import type { Tx } from '../chassis/withTenant.js';
import type { Context } from './context.js';

export interface MembershipProfile {
  orgId: string;
  membershipId: string | null;
  rbacRole: Context['rbacRole'];
  permissions: string[];
  displayName: string | null;
  email: string | null;
}

export async function getMembershipProfile(db: Tx, ctx: Context): Promise<MembershipProfile> {
  let displayName: string | null = null;
  let email: string | null = null;
  if (ctx.membershipId) {
    const rows = (await db.execute(
      sql`select display_name, email from memberships where id = ${ctx.membershipId}::uuid`,
    )) as unknown as Array<{ display_name: string | null; email: string | null }>;
    displayName = rows[0]?.display_name ?? null;
    email = rows[0]?.email ?? null;
  }
  return {
    orgId: ctx.orgId,
    membershipId: ctx.membershipId,
    rbacRole: ctx.rbacRole,
    permissions: [...ctx.permissions],
    displayName,
    email,
  };
}
