// The outbox drain runner that plugs into the outbox (DrainDeps.runMutation). Reuses the canonical
// tRPC client (@/lib/trpc — reads the live Supabase session per request). A tRPC error code maps to
// the outbox's retryable-vs-domain-rejection contract: network/5xx/INTERNAL → retryable; a domain
// code (FORBIDDEN/CONFLICT/BAD_REQUEST/NOT_FOUND) → terminal rejection (+ a server SyncException).
import { TRPCClientError } from '@trpc/client';
import { trpc } from '@/lib/trpc';
import type { CommandFailure, DrainDeps, OutboxMedia } from './outbox';

const RETRYABLE_TRPC = new Set(['INTERNAL_SERVER_ERROR', 'TIMEOUT', 'TOO_MANY_REQUESTS']);

/** Map any thrown error to the outbox's CommandFailure contract. */
export function toCommandFailure(e: unknown): CommandFailure {
  if (e instanceof TRPCClientError) {
    const code = e.data?.code as string | undefined;
    // a transport/network failure has no tRPC error code → retryable
    if (!code) return { retryable: true, message: e.message };
    if (RETRYABLE_TRPC.has(code)) return { retryable: true, message: e.message };
    return { retryable: false, reasonCode: code.toLowerCase(), message: e.message };
  }
  return { retryable: true, message: (e as Error)?.message ?? 'network' }; // unknown → assume transient
}

/** The production DrainDeps: each command type maps to its tRPC mutation; media uploads go through
 *  platform-core.storeDocument (TODO when that capability is wired — placeholder throws so a
 *  media-bearing command stays pending rather than silently dropping its evidence). */
export const trpcDrainDeps: DrainDeps = {
  runMutation: async (type, payload, idempotencyKey) => {
    try {
      // tRPC mutations are addressed by dotted path; the outbox `type` is already <module>.<Function>
      // and the router mirrors it. Pass the idempotency key in a header-free way via the input
      // envelope the drain endpoint expects.
      return await (trpc as any)[type.split('.')[0]][type.split('.')[1]].mutate({ ...payload, __idempotencyKey: idempotencyKey });
    } catch (e) {
      throw toCommandFailure(e);
    }
  },
  uploadMedia: async (_m: OutboxMedia) => {
    throw { retryable: true, message: 'storeDocument not wired yet' } as CommandFailure;
  },
};
