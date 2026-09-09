// Entity: Customer  ·  Owner module: customer-management
// Who an app bills/serves — the sell-side counterpart to vendor-management's Vendor. Three real
// shapes (drive UI + pricing, not just a label): residential (a home; one site, often no RFC, pay-on-
// service), commercial (fixed sites; RFC + net-30), fleet (the moving asset — truck/container — is the
// unit of service, may still have a depot site). Feeds facturacion (taxId/RFC) + AR + service-contracts.
// Back-ported from Rondo (packages/db/schema/customers.ts).
import { integer, jsonb, pgTable, text } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { auditColumns, orgId, pkUuid } from '../_shared.js';

export const customers = pgTable('customers', {
  id: pkUuid(),
  orgId: orgId(),
  type: text('type').notNull().default('commercial'),     // Definition customer_type
  name: text('name').notNull(),
  displayName: text('display_name'),                       // short name for schedules/route sheets; UI falls back to name
  taxId: text('tax_id'),                                   // RFC in Mexico; null for most residential
  email: text('email'),
  phone: text('phone'),
  billingAddress: jsonb('billing_address'),                // { street, exteriorNumber, colonia, city, state, postalCode, country }
  paymentTermsDays: integer('payment_terms_days').notNull().default(30), // 0 = pay-on-service (residential)
  status: text('status').notNull().default('active'),      // Definition customer_status
  notes: text('notes'),
  ...auditColumns,
});

export const customerCreateSchema = z.object({
  type: z.enum(['residential', 'commercial', 'fleet']).default('commercial'),
  name: z.string().min(1),
  displayName: z.string().nullable().optional(),
  taxId: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  billingAddress: z.record(z.unknown()).nullable().optional(),
  paymentTermsDays: z.number().int().nonnegative().default(30),
  notes: z.string().nullable().optional(),
});
export type CustomerCreate = z.infer<typeof customerCreateSchema>;
