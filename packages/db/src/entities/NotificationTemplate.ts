// Entities: NotificationTemplate + NotificationLog  ·  Owner module: platform-core
// Reusable templates rendered + dispatched across in-app / email / SMS, with a
// per-recipient delivery log. Actual transport (Resend/Twilio) is delegated to a
// connector — platform-core writes the log and hands off.
import { pgTable, text } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { auditColumns, orgId, pkUuid, tsNullable } from '../_shared.js';

export const notificationTemplates = pgTable('notification_templates', {
  id: pkUuid(),
  orgId: orgId(),
  key: text('key').notNull(), // e.g. "invitation.sent"
  channel: text('channel').notNull().default('email'), // in-app | email | sms
  subject: text('subject'),
  body: text('body').notNull(), // mustache-ish template
  ...auditColumns,
});

export const notificationLogs = pgTable('notification_logs', {
  id: pkUuid(),
  orgId: orgId(),
  templateKey: text('template_key').notNull(),
  channel: text('channel').notNull(),
  recipient: text('recipient').notNull(),
  status: text('status').notNull().default('queued'), // queued | sent | failed
  sentAt: tsNullable('sent_at'),
  error: text('error'),
});

export const renderInputSchema = z.object({
  templateKey: z.string().min(1),
  recipient: z.string().min(1),
  vars: z.record(z.string()).default({}),
});
export type RenderInput = z.infer<typeof renderInputSchema>;
