// The canonical tRPC client (Astralitics family pattern — vanilla client + raw react-query hooks
// in screens). Reads the Supabase access token live per request (no manual token plumbing); the
// server verifies it (JWKS) and resolves the Context. Dev + prod both hit /api/trpc (the Vite
// middleware in dev, the Vercel function in prod) — same-origin, so no URL config needed.
import { createTRPCClient, httpBatchLink, TRPCClientError } from '@trpc/client';
import type { AppRouter } from '@app/trpc';
import { supabase } from '@/chassis/supabase';

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      headers: async () => {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        return token ? { authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
});

export { TRPCClientError };
