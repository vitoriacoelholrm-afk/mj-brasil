// _shared.ts — the canonical column vocabulary (catalog convention, survey-catalog §1.3).
// Every owned business table is built from these helpers so "one concept, one column"
// holds by construction. org_id is a SOFT reference (plain uuid, no cross-module FK; RLS
// keys on it). Mirrors astralitics-catalog/packages/entities/src/_shared.ts.
import { pgTable, uuid, timestamp, numeric } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/** uuid PK, db-generated. */
export const pkUuid = () => uuid('id').primaryKey().default(sql`gen_random_uuid()`);

/** The tenant key on every business row. Soft ref to Org — no FK; RLS enforces isolation.
 *  DEFAULT is the GUC so the database stamps the tenant, not the caller (ADR §5.1 integrity). */
export const orgId = () =>
  uuid('org_id')
    .notNull()
    .default(sql`nullif(current_setting('app.org_id', true), '')::uuid`);

/** timestamptz now / nullable. (`tsNullable` is the catalog-entities alias of `tsNull` — both shipped
 *  so an installed domain module's entity files resolve their `_shared` import against this superset.) */
export const tsNow = (name: string) => timestamp(name, { withTimezone: true }).notNull().defaultNow();
export const tsNull = (name: string) => timestamp(name, { withTimezone: true });
export const tsNullable = (name: string) => timestamp(name, { withTimezone: true });

/** Money column: numeric(18,4). Catalog-entities helper, shipped here so installed domain entities resolve. */
export const money = (name: string) => numeric(name, { precision: 18, scale: 4 });

/** created_at/updated_at + actor strings on every owned entity. */
export const auditColumns = {
  createdAt: tsNow('created_at'),
  updatedAt: tsNow('updated_at'),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
};
