// app cell — imports @app/* (resolved in the installed app), not catalog packages. This file is
// intentionally NOT catalog-typechecked; it is materialized into the installed app's tRPC tree.
//
// complianceCertificationsRouter — the single vencimientos engine over tRPC (compliance spec §4):
// the credential vault, obligation catalog, append-only events, the 30/15/7 sweep, the traffic-light
// board, and bitácora exports. Every route is orgScopedProcedure (RLS-scoped); each Function gates.
import { z } from 'zod';
import { router, orgScopedProcedure, type ScopedContext } from '../trpc.js';
import {
  upsertCredentialRecord, credentialInput,
  listCredentials, listCredentialsInput, getCredential, vencimientosBoard,
  upsertObligation, obligationInput, transitionObligation, listObligations, listObligationsInput, getObligationDetail,
  recordComplianceEvent, eventInput, trafficLightBoard, expirySweep, syncEventsFromTasks,
  bitacoraExport, voidIssuedDocument, listIssuedDocuments, listIssuedInput,
} from '@app/db';

const sc = (ctx: unknown) => ctx as ScopedContext;

export const complianceCertificationsRouter = router({
  upsertCredentialRecord: orgScopedProcedure.input(credentialInput).mutation(({ ctx, input }) => upsertCredentialRecord(sc(ctx).db, sc(ctx).identity, input)),
  listCredentials: orgScopedProcedure.input(listCredentialsInput.optional()).query(({ ctx, input }) => listCredentials(sc(ctx).db, sc(ctx).identity, input)),
  getCredential: orgScopedProcedure.input(z.object({ id: z.string().uuid() })).query(({ ctx, input }) => getCredential(sc(ctx).db, sc(ctx).identity, input)),
  vencimientosBoard: orgScopedProcedure.input(z.object({ holderKind: z.string().optional() }).optional()).query(({ ctx, input }) => vencimientosBoard(sc(ctx).db, sc(ctx).identity, input)),

  upsertObligation: orgScopedProcedure.input(obligationInput).mutation(({ ctx, input }) => upsertObligation(sc(ctx).db, sc(ctx).identity, input)),
  transitionObligation: orgScopedProcedure.input(z.object({ id: z.string().uuid(), to: z.string(), note: z.string().optional() })).mutation(({ ctx, input }) => transitionObligation(sc(ctx).db, sc(ctx).identity, input)),
  listObligations: orgScopedProcedure.input(listObligationsInput.optional()).query(({ ctx, input }) => listObligations(sc(ctx).db, sc(ctx).identity, input)),
  getObligationDetail: orgScopedProcedure.input(z.object({ id: z.string().uuid() })).query(({ ctx, input }) => getObligationDetail(sc(ctx).db, sc(ctx).identity, input)),

  recordComplianceEvent: orgScopedProcedure.input(eventInput).mutation(({ ctx, input }) => recordComplianceEvent(sc(ctx).db, sc(ctx).identity, input)),
  trafficLightBoard: orgScopedProcedure.input(z.object({ domain: z.string().optional() }).optional()).query(({ ctx, input }) => trafficLightBoard(sc(ctx).db, sc(ctx).identity, input)),
  expirySweep: orgScopedProcedure.input(z.object({ asOf: z.string().optional(), dryRun: z.boolean().optional() }).optional()).mutation(({ ctx, input }) => expirySweep(sc(ctx).db, sc(ctx).identity, input)),
  syncEventsFromTasks: orgScopedProcedure.input(z.object({ obligationId: z.string().uuid() })).mutation(({ ctx, input }) => syncEventsFromTasks(sc(ctx).db, sc(ctx).identity, input)),

  bitacoraExport: orgScopedProcedure.input(z.object({ obligationId: z.string().uuid(), from: z.string(), to: z.string() })).mutation(({ ctx, input }) => bitacoraExport(sc(ctx).db, sc(ctx).identity, input)),
  voidIssuedDocument: orgScopedProcedure.input(z.object({ id: z.string().uuid(), reason: z.string() })).mutation(({ ctx, input }) => voidIssuedDocument(sc(ctx).db, sc(ctx).identity, input)),
  listIssuedDocuments: orgScopedProcedure.input(listIssuedInput.optional()).query(({ ctx, input }) => listIssuedDocuments(sc(ctx).db, sc(ctx).identity, input)),
});
