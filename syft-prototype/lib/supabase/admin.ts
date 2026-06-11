import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./config";

// Server-only Supabase client using the SERVICE ROLE key — bypasses Row Level
// Security. Used for (a) seeding system profiles and (b) reading the full matching
// pool + writing a user's embedded profile server-side. NEVER import this from a
// client component; the service key must never reach the browser.
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function hasAdmin(): boolean {
  return Boolean(SUPABASE_URL && SERVICE_KEY);
}

export function createAdminClient() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error(
      "Supabase admin not configured — set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
