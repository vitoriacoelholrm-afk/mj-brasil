// Entity: Document  ·  Owner module: platform-core
// File metadata backed by Supabase Storage. Attaches to any owning record via a SOFT
// polymorphic (ownerType, ownerId) pair — no cross-module FK (§6).
import { jsonb, pgTable, text } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { auditColumns, orgId, pkUuid } from '../_shared.js';

export const documents = pgTable('documents', {
  id: pkUuid(),
  orgId: orgId(),
  name: text('name').notNull(),
  storageKey: text('storage_key').notNull(), // path in Supabase Storage
  contentType: text('content_type'),
  category: text('category'),
  // polymorphic owner — opaque strings; platform-core never imports other modules' schemas
  ownerType: text('owner_type'), // e.g. "invoice" | "project" | "service_visit"
  ownerId: text('owner_id'),
  tags: jsonb('tags'),
  ...auditColumns,
});

export const documentCreateSchema = z.object({
  name: z.string().min(1),
  storageKey: z.string().min(1),
  contentType: z.string().optional(),
  category: z.string().optional(),
  ownerType: z.string().optional(),
  ownerId: z.string().optional(),
});
export type DocumentCreate = z.infer<typeof documentCreateSchema>;
