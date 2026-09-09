// The HTTP entry — a framework-agnostic fetch handler (Web Request → Response) that mounts the
// app router and resolves createContext from the request headers. Reusable across the Vercel
// function entry and tests. Every channel (web/edge/cron) ultimately reaches the same router.
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from './routers/index.js';
import { createContext } from './context.js';

export const TRPC_ENDPOINT = '/api/trpc';

export function trpcFetchHandler(req: Request): Promise<Response> {
  return fetchRequestHandler({
    endpoint: TRPC_ENDPOINT,
    req,
    router: appRouter,
    createContext: () => createContext({ headers: Object.fromEntries(req.headers.entries()) }),
  });
}
