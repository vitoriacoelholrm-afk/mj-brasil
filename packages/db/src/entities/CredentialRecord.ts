// Entity: CredentialRecord  ·  Owner module: compliance-certifications
// The polymorphic artifact that expires — the credential vault. Expiry-indexed (org_id, expires_at):
// the engine column the 30/15/7 sweep reads. holder_id is a SOFT polymorphic ref (staff→Membership /
// vendor→Vendor / asset→Asset / org→null). Cross-module refs (document_id) are SOFT uuids — no FK (§6).
// Back-ported from copafix (packages/db/src/compliance-certifications/schema.ts).
import { pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { auditColumns, orgId, pkUuid } from '../_shared.js';

export const credentialRecords = pgTable('credential_records', {
  id: pkUuid(),
  orgId: orgId(),
  holderKind: text('holder_kind').notNull(),                   // Definition credential_holder_kind
  holderId: uuid('holder_id'),                                 // soft poly → Membership/Vendor/Asset (null when org)
  holderLabel: text('holder_label').notNull(),
  kind: text('kind').notNull(),                                // Definition credential_kind
  title: text('title'),
  number: text('number'),
  issuingAuthority: text('issuing_authority'),
  issuedAt: text('issued_at'),                                 // date (no time component)
  expiresAt: text('expires_at'),                               // date — THE engine index (org_id, expires_at)
  documentId: uuid('document_id'),                             // soft → platform-core.documents
  obligationId: uuid('obligation_id'),                         // soft → compliance_obligations
  status: text('status').notNull().default('active'),          // Definition credential_status
  replacedById: uuid('replaced_by_id'),                       // self-ref → supersede chain
  alertStage: text('alert_stage'),                            // Definition expiry_alert_stage
  revokeReason: text('revoke_reason'),
  notes: text('notes'),
  ...auditColumns,
});

export const credentialRecordCreateSchema = z.object({
  holderKind: z.string(),                                     // Definition credential_holder_kind
  holderId: z.string().uuid().optional(),
  holderLabel: z.string().min(1),
  kind: z.string(),                                           // Definition credential_kind (open vocab)
  title: z.string().optional(),
  number: z.string().optional(),
  issuingAuthority: z.string().optional(),
  issuedAt: z.string().optional(),
  expiresAt: z.string().optional(),
  documentId: z.string().uuid().optional(),
  obligationId: z.string().uuid().optional(),
  notes: z.string().optional(),
});
export type CredentialRecordCreate = z.infer<typeof credentialRecordCreateSchema>;
