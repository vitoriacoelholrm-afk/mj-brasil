// chassisRouter — the offline sync-exception surface over tRPC (_chassis.md §4.1, §6 /admin/sync).
// Every route is orgScopedProcedure: the handler runs inside withTenant, so ctx.db is RLS-scoped;
// the capability's own can() check adds the action-level permission gate.
import { router, orgScopedProcedure, type ScopedContext } from '../trpc.js';
import {
  listSyncExceptions, listFilter,
  resolveSyncException, resolveSyncExceptionInput,
} from '@app/db';

export const chassisRouter = router({
  listSyncExceptions: orgScopedProcedure
    .input(listFilter)
    .query(({ ctx, input }) => {
      const sc = ctx as unknown as ScopedContext;
      return listSyncExceptions(sc.db, sc.identity, input);
    }),

  resolveSyncException: orgScopedProcedure
    .input(resolveSyncExceptionInput)
    .mutation(({ ctx, input }) => {
      const sc = ctx as unknown as ScopedContext;
      return resolveSyncException(sc.db, sc.identity, input);
    }),
});
