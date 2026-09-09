// The browser Supabase client — used ONLY for Auth (login/session). All data access goes through
// tRPC (the governed request path), never the Supabase data API directly. The anon key + URL are
// public by design; they're safe because RLS FORCE is on every table (D2/§1.3) — the demo's sin was
// a service key + RLS off, not the anon key.
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase = createClient(url ?? '', anon ?? '', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});

export const supabaseConfigured = !!(url && anon);
