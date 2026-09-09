// @astralitics/module-compliance-certifications — public surface.
// The single vencimientos engine: the credential vault, the obligation catalog, the append-only event
// chronology, the 30/15/7 expiry sweep, the traffic-light board, and bitácora exports. Back-ported
// from copafix (packages/db/src/compliance-certifications) as a full domain module (entities +
// Functions + transitions + migration). Cross-module spawn calls (scheduling/equipment) are
// INJECTED DEPS (ComplianceDeps), wired by the app at the router (G24 anti-cycle).
export * from './functions/index.js';

// Re-export the owned entities (the public data surface) so consumers resolve them from this module.
export {
  complianceObligations, complianceObligationCreateSchema, type ComplianceObligationCreate,
  credentialRecords, credentialRecordCreateSchema, type CredentialRecordCreate,
  complianceEvents, complianceEventCreateSchema, type ComplianceEventCreate,
  issuedDocuments, issuedDocumentCreateSchema, type IssuedDocumentCreate,
} from '@astralitics/entities';
