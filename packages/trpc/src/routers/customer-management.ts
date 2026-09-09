// app cell — imports @app/* (resolved in the installed app), not catalog packages. Excluded from the
// catalog typecheck (it typechecks in a scaffolded app via `astralitics verify-cells`). The export name
// must be `customerManagementRouter` (the install mounts it by this name).
import { router, orgScopedProcedure, type ScopedContext } from '../trpc.js';
import { checkCustomerTransition, checkCustomerTransitionInput } from '@app/db';

const sc = (ctx: unknown) => ctx as ScopedContext;

export const customerManagementRouter = router({
  checkCustomerTransition: orgScopedProcedure.input(checkCustomerTransitionInput).query(({ ctx, input }) => checkCustomerTransition(sc(ctx).db, sc(ctx).identity, input)),
});
