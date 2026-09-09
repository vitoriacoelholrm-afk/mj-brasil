// app cell — imports @app/* (resolved in the installed app), not catalog packages. Excluded from the
// catalog typecheck (it typechecks in a scaffolded app via `astralitics verify-cells`). The export name
// must be `customerManagementRouter` (the install mounts it by this name).
//
// customerManagementRouter — the sell-side directory over tRPC. Every route is orgScopedProcedure
// (runs inside withTenant → RLS-scoped); each capability does its own can() check.
import { router, orgScopedProcedure, type ScopedContext } from '../trpc.js';
import {
  createCustomer, customerCreateSchema,
  listCustomers, listCustomersInput,
  updateCustomer, updateCustomerInput,
  setCustomerStatus, setCustomerStatusInput,
  checkCustomerTransition, checkCustomerTransitionInput,
} from '@app/db';

const sc = (ctx: unknown) => ctx as ScopedContext;

export const customerManagementRouter = router({
  createCustomer: orgScopedProcedure.input(customerCreateSchema).mutation(({ ctx, input }) => createCustomer(sc(ctx).db, sc(ctx).identity, input)),
  listCustomers: orgScopedProcedure.input(listCustomersInput.optional()).query(({ ctx, input }) => listCustomers(sc(ctx).db, sc(ctx).identity, input)),
  updateCustomer: orgScopedProcedure.input(updateCustomerInput).mutation(({ ctx, input }) => updateCustomer(sc(ctx).db, sc(ctx).identity, input)),
  setCustomerStatus: orgScopedProcedure.input(setCustomerStatusInput).mutation(({ ctx, input }) => setCustomerStatus(sc(ctx).db, sc(ctx).identity, input)),
  checkCustomerTransition: orgScopedProcedure.input(checkCustomerTransitionInput).query(({ ctx, input }) => checkCustomerTransition(sc(ctx).db, sc(ctx).identity, input)),
});
