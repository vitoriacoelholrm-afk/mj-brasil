// customer-management Functions — pure (db, ctx, input) logic; db is a tenant-scoped DbOrTx. Ships the
// Customer status-machine verb (checkCustomerTransition) — the lifecycle gate other modules
// (service-contracts, AR) rely on — plus the CRUD/query verbs (createCustomer, listCustomers,
// updateCustomer, setCustomerStatus) ported from Rondo (packages/trpc/src/routers/customers.ts).
// Mirrors the back-ported pattern: can() gate (customer.read | customer.write), Zod at the boundary,
// org_id set from ctx on inserts, FunctionError on a domain rejection. Audit text columns carry
// ctx.actor ("member:<id>"); status defaults follow Definition customer_status (active | inactive —
// Rondo's loose 'prospect' is dropped to the catalog value-set).
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import type { Context, DbOrTx } from '@astralitics/module-identity-access';
import { can, FunctionError, ForbiddenError } from '@astralitics/module-identity-access';
import { customerCreateSchema } from '@astralitics/entities';
import { isLegalCustomerTransition } from './transitions.js';

const uuid = z.string().uuid();

export const checkCustomerTransitionInput = z.object({
  customerId: uuid,
  from: z.string().min(1),
  to: z.string().min(1),
});

/** Validate a Customer status transition against the lifecycle (Definition customer_status). Pure
 *  decision verb — gates on customer.write, rejects an illegal edge with ILLEGAL_TRANSITION. */
export async function checkCustomerTransition(db: DbOrTx, ctx: Context, input: z.infer<typeof checkCustomerTransitionInput>) {
  const i = checkCustomerTransitionInput.parse(input);
  if (!can(ctx, 'customer.write')) throw new ForbiddenError('customer.write');
  if (!isLegalCustomerTransition(i.from, i.to)) throw new FunctionError('ILLEGAL_TRANSITION', `${i.from} → ${i.to}`);
  return { customerId: i.customerId, from: i.from, to: i.to, legal: true as const };
}

// ════════════════════════════════════════════ CRUD ══════════════════════════════════════════════
// Ported from Rondo's customersRouter (create/list/update/archive|unarchive). The Customer columns are
// the catalog Customer (packages/entities/src/Customer.ts); Rondo's `prospect` status + page-count
// envelope adapt to the catalog's two-state lifecycle and a flat list.

/** Insert a customer. org_id from ctx, gate customer.write. Rondo guards nothing on create beyond Zod;
 *  we add a same-org duplicate-name guard (DUPLICATE_NAME) — names are the human key on the sell side. */
export async function createCustomer(db: DbOrTx, ctx: Context, input: z.infer<typeof customerCreateSchema>) {
  const i = customerCreateSchema.parse(input);
  if (!can(ctx, 'customer.write')) throw new ForbiddenError('customer.write');
  const dup = (await db.execute(sql`select id from customers where org_id = ${ctx.orgId}::uuid and lower(name) = lower(${i.name}) limit 1`)) as unknown as Array<{ id: string }>;
  if (dup.length) throw new FunctionError('DUPLICATE_NAME', i.name);
  const billing = i.billingAddress != null ? sql`${JSON.stringify(i.billingAddress)}::jsonb` : sql`null`;
  const rows = (await db.execute(sql`
    insert into customers (org_id, type, name, display_name, tax_id, email, phone, billing_address, payment_terms_days, notes, created_by, updated_by)
    values (${ctx.orgId}::uuid, ${i.type}, ${i.name}, ${i.displayName ?? null}, ${i.taxId ?? null}, ${i.email ?? null}, ${i.phone ?? null}, ${billing}, ${i.paymentTermsDays}, ${i.notes ?? null}, ${ctx.actor}, ${ctx.actor})
    returning id, type, name, display_name, tax_id, email, phone, payment_terms_days, status, notes`)) as unknown as Array<Record<string, unknown>>;
  return rows[0];
}

export const listCustomersInput = z.object({
  type: z.enum(['residential', 'commercial', 'fleet']).optional(),
  status: z.string().min(1).optional(),
  search: z.string().min(1).optional(),
});

/** List customers for the org, newest-touched first. Optional type/status filter + name/email/RFC
 *  search (Rondo's list, minus the page-count envelope). Gate customer.read. */
export async function listCustomers(db: DbOrTx, ctx: Context, input: z.infer<typeof listCustomersInput> = {}) {
  const i = listCustomersInput.parse(input);
  if (!can(ctx, 'customer.read')) throw new ForbiddenError('customer.read');
  const pattern = i.search ? `%${i.search}%` : null;
  const rows = (await db.execute(sql`
    select id, type, name, display_name, tax_id, email, phone, payment_terms_days, status, notes, updated_at
    from customers
    where org_id = ${ctx.orgId}::uuid
      ${i.type ? sql`and type = ${i.type}` : sql``}
      ${i.status ? sql`and status = ${i.status}` : sql``}
      ${pattern ? sql`and (name ilike ${pattern} or display_name ilike ${pattern} or email ilike ${pattern} or tax_id ilike ${pattern})` : sql``}
    order by updated_at desc
  `)) as unknown as Array<Record<string, unknown>>;
  return rows;
}

export const updateCustomerInput = z.object({
  id: uuid,
  name: z.string().min(1).optional(),
  displayName: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  billingAddress: z.record(z.unknown()).nullable().optional(),
  paymentTermsDays: z.number().int().nonnegative().optional(),
  notes: z.string().nullable().optional(),
});

/** Patch mutable fields by id (org-scoped). Status is NOT patched here — it transitions via
 *  setCustomerStatus through the lifecycle machine. Gate customer.write; NOT_FOUND if absent. */
export async function updateCustomer(db: DbOrTx, ctx: Context, input: z.infer<typeof updateCustomerInput>) {
  const i = updateCustomerInput.parse(input);
  if (!can(ctx, 'customer.write')) throw new ForbiddenError('customer.write');
  const sets = [sql`updated_at = now()`, sql`updated_by = ${ctx.actor}`];
  if (i.name !== undefined) sets.push(sql`name = ${i.name}`);
  if (i.displayName !== undefined) sets.push(sql`display_name = ${i.displayName}`);
  if (i.email !== undefined) sets.push(sql`email = ${i.email}`);
  if (i.phone !== undefined) sets.push(sql`phone = ${i.phone}`);
  if (i.billingAddress !== undefined) sets.push(sql`billing_address = ${i.billingAddress === null ? sql`null` : sql`${JSON.stringify(i.billingAddress)}::jsonb`}`);
  if (i.paymentTermsDays !== undefined) sets.push(sql`payment_terms_days = ${i.paymentTermsDays}`);
  if (i.notes !== undefined) sets.push(sql`notes = ${i.notes}`);
  const rows = (await db.execute(sql`
    update customers set ${sql.join(sets, sql`, `)}
    where id = ${i.id}::uuid and org_id = ${ctx.orgId}::uuid
    returning id, type, name, display_name, tax_id, email, phone, payment_terms_days, status, notes`)) as unknown as Array<Record<string, unknown>>;
  if (!rows.length) throw new FunctionError('NOT_FOUND', i.id);
  return rows[0];
}

export const setCustomerStatusInput = z.object({
  id: uuid,
  status: z.string().min(1),
});

/** Transition a customer's status (Rondo's archive/unarchive, generalized). Reads the current status,
 *  validates the edge through isLegalCustomerTransition, then writes it. Gate customer.write;
 *  NOT_FOUND if absent, ILLEGAL_TRANSITION on a rejected edge. */
export async function setCustomerStatus(db: DbOrTx, ctx: Context, input: z.infer<typeof setCustomerStatusInput>) {
  const i = setCustomerStatusInput.parse(input);
  if (!can(ctx, 'customer.write')) throw new ForbiddenError('customer.write');
  const cur = (await db.execute(sql`select status from customers where id = ${i.id}::uuid and org_id = ${ctx.orgId}::uuid limit 1`)) as unknown as Array<{ status: string }>;
  if (!cur.length) throw new FunctionError('NOT_FOUND', i.id);
  const from = cur[0].status;
  if (from === i.status) return { id: i.id, status: i.status, changed: false as const };
  if (!isLegalCustomerTransition(from, i.status)) throw new FunctionError('ILLEGAL_TRANSITION', `${from} → ${i.status}`);
  const rows = (await db.execute(sql`
    update customers set status = ${i.status}, updated_at = now(), updated_by = ${ctx.actor}
    where id = ${i.id}::uuid and org_id = ${ctx.orgId}::uuid
    returning id, status`)) as unknown as Array<Record<string, unknown>>;
  return { ...rows[0], changed: true as const };
}
