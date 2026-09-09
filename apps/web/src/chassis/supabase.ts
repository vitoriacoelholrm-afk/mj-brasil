// The browser Supabase client — used ONLY for Auth (login/session). All data access goes through
// tRPC (the governed request path), never the Supabase data API directly. The anon key + URL are
// public by design; they're safe because RLS FORCE is on every table (D2/§1.3) — the demo's sin was
// a service key + RLS off, not the anon key.
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseConfigured = !!(url && anon);

// Sem projeto Supabase configurado, createClient('','') lança "supabaseUrl is required" no import e
// derruba o app inteiro na primeira tela que toque no cliente tRPC. Enquanto a autenticação real
// não entra, devolvemos um substituto que apenas informa "não há sessão" — o app segue funcionando
// pela sessão de desenvolvimento, e qualquer outra chamada falha alto em vez de silenciosamente.
const semSessao = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    signOut: async () => ({ error: null }),
  },
} as unknown as ReturnType<typeof createClient>;

export const supabase = supabaseConfigured
  ? createClient(url!, anon!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    })
  : semSessao;
