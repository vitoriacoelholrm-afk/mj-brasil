// The canonical tRPC client (Astralitics family pattern — vanilla client + raw react-query hooks
// in screens). Reads the Supabase access token live per request (no manual token plumbing); the
// server verifies it (JWKS) and resolves the Context. Dev + prod both hit /api/trpc (the Vite
// middleware in dev, the Vercel function in prod) — same-origin, so no URL config needed.
import { createTRPCClient, httpBatchLink, TRPCClientError } from '@trpc/client';
import type { AppRouter } from '@app/trpc';
import { supabase } from '@/chassis/supabase';
import { membershipAtual } from '@/lib/session';
import { apiDemo } from '@/demo/api';

const clienteReal = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      headers: async () => {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (token) return { authorization: `Bearer ${token}` };
        // Sessão de desenvolvimento: o servidor só honra este header no `vite dev` com
        // ALLOW_DEV_LOGIN=true (ver apps/web/vite.config.ts). Em produção é ignorado.
        const dev = membershipAtual();
        return dev ? { 'x-dev-membership': dev } : {};
      },
    }),
  ],
});

/** No build de demonstração não existe servidor: as telas falam com dados fixos, só leitura. */
export const trpc = (import.meta.env?.VITE_DEMO === '1' ? apiDemo : clienteReal) as typeof clienteReal;

export { TRPCClientError };
