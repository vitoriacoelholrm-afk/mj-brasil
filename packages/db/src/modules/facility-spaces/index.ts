// @astralitics/module-facility-spaces — public surface.
//
// The location tree (property > floor > room/area) + the append-only room-status event log.
// facility-spaces is a LOW dependency: it hard-imports only identity-access (Context/can/errors) and
// @astralitics/definitions; higher modules (equipment-maintenance/scheduling) consume getLocation by
// INJECTING it as a deps resolver (anti-cycle G24), never by hard-importing this module. The single
// guarded write door to room status is applyStatusTransition (the offline.commands target).
//
// Back-ported from copafix (packages/db/src/facility-spaces) — the room-status slice only; SpaceBlock /
// SpaceBlockRoom / OccupancyInput (the FU overlay + occupancy feed) land in a later increment.

// The module's Functions + input schemas + pure FSM/occupancy helpers.
export * from './functions/index.js';

// The entities it owns (re-exported from the global entity catalog).
export {
  locations, locationCreateSchema, type LocationCreate,
  spaceStatusEvents, spaceStatusEventCreateSchema, type SpaceStatusEventCreate,
} from '@astralitics/entities';
