// customer-management — Function barrel. Public verbs + the pure FSM helpers the contract test pins.
export {
  checkCustomerTransition, checkCustomerTransitionInput,
  createCustomer,
  listCustomers, listCustomersInput,
  updateCustomer, updateCustomerInput,
  setCustomerStatus, setCustomerStatusInput,
} from './functions.js';

export {
  CUSTOMER_TRANSITIONS,
  isLegalCustomerTransition,
} from './transitions.js';
