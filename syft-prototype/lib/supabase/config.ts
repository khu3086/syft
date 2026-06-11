// Supabase connection config. Reads the public env vars (safe to expose — the
// anon key is designed for browsers and is gated by Row Level Security).
// `isSupabaseConfigured()` lets the app degrade gracefully (and keep the
// search/voice prototype usable) before you've pasted your keys in.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}
