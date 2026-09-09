// Entity: IssuedDocument  ·  Owner module: compliance-certifications
// The folio + snapshot register (ORG-YYYY-NNNNN). Documents are never deleted — only voided.
// issued_by/voided_by are STRING actors (`member:<id>` | ctx.actor | 'app'), NOT uuids. Cross-module
// refs (document_id → platform-core.documents) are SOFT uuids — no FK (§6). The (org_id, number)
// uniqueness is a real unique constraint. jsonb (snapshot) is real jsonb in the SQL migration.
// Back-ported from copafix (packages/db/src/compliance-certifications/schema.ts).
import { integer, jsonb, pgTable, text, unique, uuid } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { auditColumns, orgId, pkUuid, tsNow, tsNullable } from '../_shared.js';

export const issuedDocuments = pgTable('issued_documents', {
  id: pkUuid(),
  orgId: orgId(),
  kind: text('kind').notNull(),                                // Definition issued_document_kind
  number: text('number').notNull(),                            // ORG-YYYY-NNNNN
  year: integer('year').notNull(),
  seq: integer('seq').notNull(),
  title: text('title').notNull(),
  obligationId: uuid('obligation_id'),                         // soft → compliance_obligations
  normRef: text('norm_ref'),
  periodFrom: text('period_from'),                             // date (no time component)
  periodTo: text('period_to'),                                 // date (no time component)
  snapshot: jsonb('snapshot').notNull(),
  documentId: uuid('document_id'),                             // soft → platform-core.documents
  issuedAt: tsNow('issued_at'),
  issuedBy: text('issued_by').notNull(),                       // actor string, NOT uuid
  status: text('status').notNull().default('issued'),          // Definition issued_document_status
  voidedAt: tsNullable('voided_at'),
  voidedBy: text('voided_by'),                                 // actor string, NOT uuid
  voidReason: text('void_reason'),
  ...auditColumns,
}, (t) => ({ numUq: unique('issued_documents_org_number_uq').on(t.orgId, t.number) }));

export const issuedDocumentCreateSchema = z.object({
  kind: z.string(),                                           // Definition issued_document_kind
  title: z.string().min(1),
  obligationId: z.string().uuid().optional(),
  normRef: z.string().optional(),
  periodFrom: z.string().optional(),
  periodTo: z.string().optional(),
  snapshot: z.record(z.unknown()),
});
export type IssuedDocumentCreate = z.infer<typeof issuedDocumentCreateSchema>;
