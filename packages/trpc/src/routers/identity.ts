// identityRouter — the "who am I" surface. `me` returns the resolved Context basics + display name,
// so the client can pick the right layout (field roles → mobile; admin/executive → desktop sidebar)
// and gate UI. Runs through orgScopedProcedure, so the identity is already resolved + RLS-scoped.
// The read model lives in @app/db (getMembershipProfile) — the router stays thin.
import { getMembershipProfile } from '@app/db';
import { router, orgScopedProcedure, type ScopedContext } from '../trpc.js';

export const identityRouter = router({
  me: orgScopedProcedure.query(({ ctx }) => {
    const sc = ctx as unknown as ScopedContext;
    return getMembershipProfile(sc.db, sc.identity);
  }),
});
