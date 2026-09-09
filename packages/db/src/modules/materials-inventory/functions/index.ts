// materials-inventory — Function barrel. The verbs (catalog + stock + the read seams) + the pure FSM
// helpers the contract test pins. consumeAgainstTask takes an injected MaterialsDeps.getTask (G24).
export {
  createMaterial, materialCreateInput, type MaterialCreateInput,
  listMaterials, listMaterialsInput,
  getMaterial,
  receiveStock, receiveStockInput,
  consumeAgainstTask, consumeAgainstTaskInput, type MaterialsDeps,
  reverseMovement, reverseMovementInput,
  stockOnHand,
  consumptionForTask,
  applyLotDelta,
} from './functions.js';

// pure FSM + boundary helpers (the contract-test surface)
export {
  LOT_TRANSITIONS,
  isLegalLot,
  signOkForKind,
  decrementsLot,
  applyLotMath,
} from './transitions.js';
