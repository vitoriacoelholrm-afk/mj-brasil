// compliance-certifications capability barrel — the verbs + their input schemas + the injected-deps
// type + the pure FSM helpers the contract test pins.
export {
  // credentials
  upsertCredentialRecord, credentialInput, type CredentialInput,
  listCredentials, listCredentialsInput, getCredential, vencimientosBoard,
  // obligations
  upsertObligation, obligationInput, transitionObligation, listObligations, listObligationsInput, getObligationDetail,
  // events
  recordComplianceEvent, eventInput, recomputeNextDue,
  // board
  trafficLightBoard,
  // sweep + loop-closers
  expirySweep, spawnObligationTask, syncEventsFromTasks,
  // issued documents
  bitacoraExport, voidIssuedDocument, listIssuedDocuments, listIssuedInput, nextSequence,
  // injected deps (G24 anti-cycle) — the app wires the resolver at the router
  type ComplianceDeps,
} from './functions.js';

// pure FSM + compute helpers (the contract-test surface)
export {
  OBLIGATION_TRANSITIONS, isLegalObligation,
  CREDENTIAL_TRANSITIONS, isLegalCredential,
  daysUntil, alertStageFor, stageAdvanced, computeLight, type Light,
} from './transitions.js';
