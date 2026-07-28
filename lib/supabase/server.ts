import { createClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";

/**
 * Server-side Supabase client (anon key).
 * Use for public reads and future authenticated server actions.
 */
export function createServerSupabaseClient() {
  return createClient(env.server.SUPABASE_URL, env.server.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Service-role client for trusted server-only operations (storage admin, etc.).
 * Never import this into client components.
 */
export function createServiceRoleSupabaseClient() {
  const serviceRoleKey = env.server.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for service-role operations",
    );
  }

  return createClient(env.server.SUPABASE_URL, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
