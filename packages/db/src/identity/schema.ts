// identity-access entities (catalog foundation module) — part of the standard chassis spine: the
// orgs tenant root + the login principal (Membership) + the RBAC quad. These are what resolveContext
// reads to turn a verified principal into a request Context. Drizzle tables; every org_id table
// carries the mandatory RLS appendix in its migration (0002_identity_access.sql).
import { pgTable, uuid, text, jsonb, boolean, timestamp, unique } from 'drizzle-orm/pg-core';
import { pkUuid, orgId, tsNow, tsNull, auditColumns } from '../_shared.js';

export const orgs = pgTable('orgs', {
  id: pkUuid(),
  slug: text('slug').notNull(),
  name: text('name').notNull(),
  settings: jsonb('settings').notNull().default({}),
  isPrimary: boolean('is_primary').notNull().default(false),
  status: text('status').notNull().default('active'),
  archivedAt: tsNull('archived_at'),
  ...auditColumns,
}, (t) => ({ slugUq: unique('orgs_slug_uq').on(t.slug) }));

export const memberships = pgTable('memberships', {
  id: pkUuid(),
  orgId: orgId(),
  authUserId: uuid('auth_user_id'),
  displayName: text('display_name').notNull(),
  email: text('email'),
  rbacRole: text('rbac_role').notNull().default('employee'), // admin | executive | employee
  pinHash: text('pin_hash'),
  status: text('status').notNull().default('active'), // active | invited | suspended
  invitedAt: tsNull('invited_at'),
  activatedAt: tsNull('activated_at'),
  ...auditColumns,
});

export const roles = pgTable('roles', {
  id: pkUuid(),
  orgId: orgId(),
  name: text('name').notNull(),
  description: text('description'),
  ...auditColumns,
}, (t) => ({ nameUq: unique('roles_org_name_uq').on(t.orgId, t.name) }));

export const rolePermissions = pgTable('role_permissions', {
  id: pkUuid(),
  orgId: orgId(),
  roleId: uuid('role_id').notNull(),
  permissionKey: text('permission_key').notNull(),
  ...auditColumns,
}, (t) => ({ uq: unique('role_permissions_uq').on(t.orgId, t.roleId, t.permissionKey) }));

export const roleAssignments = pgTable('role_assignments', {
  id: pkUuid(),
  orgId: orgId(),
  membershipId: uuid('membership_id').notNull(),
  roleId: uuid('role_id').notNull(),
  ...auditColumns,
}, (t) => ({ uq: unique('role_assignments_uq').on(t.orgId, t.membershipId, t.roleId) }));
