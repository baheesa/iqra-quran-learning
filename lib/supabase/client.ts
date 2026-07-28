import { createClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";

/**
 * Browser / client-side Supabase client.
 * Authentication flows are intentionally not implemented yet.
 */
export function createBrowserSupabaseClient() {
  return createClient(
    env.client.NEXT_PUBLIC_SUPABASE_URL,
    env.client.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    },
  );
}
