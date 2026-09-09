// resolveContext — db-backed (identity-access; the catalog cell ships only the pure computeContext).
// THE sanctioned admin-role bootstrap: finding which org an auth user belongs to MUST happen
// before the tenant GUC can be set (chicken-and-egg), so it runs under the admin role (BYPASSRLS)
// with EXPLICIT org/auth filters in SQL — exactly the "narrow operations that legitimately need
// admin_role filter org_id explicitly" carve-out (ARCHITECTURE.md §5.1). No tenant GUC is set
// here; the caller (orgScopedProcedure) opens withTenant(ctx.orgId) for the actual work.
import { sql } from 'drizzle-orm';
import { adminDb } from '../client.js';

export interface Principal {
  authUserId?: string | null;
  membershipId?: string | null; // floor-PIN path resolves a membership directly
}

export interface ResolveInput {
  principal: Principal;
  activeOrgId?: string | null; // x-active-org header (validated against memberships)
}

/** Resolve (authUserId | membershipId, optional activeOrg) → the Context spine. Throws
 *  'NO_MEMBERSHIP' when the principal maps to no active membership. */
export async function resolveContext(input: ResolveInput) {
  const db = adminDb();
  const { authUserId, membershipId } = input.principal;
  if (!authUserId && !membershipId) throw new Error('resolveContext: principal needs authUserId or membershipId');

  // 1. Candidate active memberships for this principal, across orgs (admin, explicit filter).
  const rows = (await db.execute(sql`
    select m.id, m.org_id, m.rbac_role, o.is_primary
    from memberships m
    join orgs o on o.id = m.org_id and o.status = 'active'
    where m.status = 'active'
      and (${authUserId ?? null}::uuid is not null and m.auth_user_id = ${authUserId ?? null}::uuid
           or ${membershipId ?? null}::uuid is not null and m.id = ${membershipId ?? null}::uuid)
  `)) as unknown as Array<{ id: string; org_id: string; rbac_role: string; is_primary: boolean }>;

  if (rows.length === 0) throw new Error('NO_MEMBERSHIP');

  // 2. Pick the active org: requested (if a member) → primary → first.
  let chosen = input.activeOrgId ? rows.find((r) => r.org_id === input.activeOrgId) : undefined;
  if (input.activeOrgId && !chosen) throw new Error('NOT_A_MEMBER_OF_ACTIVE_ORG');
  chosen ??= rows.find((r) => r.is_primary) ?? rows[0];

  // 3. Effective permissions. admin short-circuits to '*'; others = union of assigned role perms
  //    (admin role + explicit org filter — still bootstrap, pre-tenant).
  const permissions = new Set<string>();
  if (chosen.rbac_role === 'admin') {
    permissions.add('*');
  } else {
    const perms = (await db.execute(sql`
      select distinct rp.permission_key as key
      from role_assignments ra
      join role_permissions rp on rp.role_id = ra.role_id and rp.org_id = ra.org_id
      where ra.org_id = ${chosen.org_id}::uuid and ra.membership_id = ${chosen.id}::uuid
    `)) as unknown as Array<{ key: string }>;
    for (const p of perms) permissions.add(p.key);
  }

  return {
    orgId: chosen.org_id,
    membershipId: chosen.id,
    actor: `member:${chosen.id}`,
    rbacRole: chosen.rbac_role as 'admin' | 'executive' | 'employee',
    permissions,
  };
}
