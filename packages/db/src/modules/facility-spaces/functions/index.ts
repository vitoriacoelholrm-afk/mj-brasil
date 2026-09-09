// facility-spaces capabilities barrel — the verbs + their input schemas + the pure FSM helpers
// (transitions.ts is what the contract test pins). src/index.ts re-exports this as the public surface.
export { applyStatusTransition, applyStatusTransitionInput, type ApplyStatusTransitionInput } from './applyStatusTransition.js';
export { getCurrentHouse, houseFilter, type HouseFilter } from './getCurrentHouse.js';
export { getLocationTree, treeFilter, type TreeFilter } from './getLocationTree.js';
export { getLocation } from './getLocation.js';
export { getStatusHistory } from './getStatusHistory.js';
export { getLegalTransitions } from './getLegalTransitions.js';

// Pure FSM / occupancy helpers (no DB) — the contract-test surface + shared by the app's UI.
export {
  SPACE_STATUS_TRANSITIONS,
  cleanlinessRank,
  isDownRank,
  isStatus,
  // isLegalTransition/legalNext stay internal (intra-module + the contract test import them straight
  // from ./transitions.ts): both facility-spaces and scheduling-field-service define those generic
  // names, so re-exporting them here collides in the app's flat @app/db barrel (G20).
  OCCUPIED_STATUSES,
  AVAILABLE_STATUSES,
  occupancyFromTotals,
  type OccupancySummary,
} from './transitions.js';
