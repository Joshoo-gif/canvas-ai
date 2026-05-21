/**
 * Server-side Supabase client.
 *
 * Uses the secret key so it bypasses Row Level Security.
 * Import only in server code: API routes, server actions, server components.
 *
 * Supabase's new API uses "publishable" and "secret" keys instead of
 * "anon" and "service_role" — the client constructor still receives them
 * as (url, key) but the key semantics have changed.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

// We skip the Database generic here to avoid fighting with supabase-js's internal
// GenericSchema constraint. All repository functions cast results to the correct
// row types manually, giving us full type safety without the generic overhead.
type AnyClient = SupabaseClient<any, any, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

let _client: AnyClient | null = null;

/**
 * Returns a singleton Supabase client configured with the secret key.
 * The client is cached in the module scope so it is reused across requests
 * in the same server process.
 */
export function getSupabaseServer(): AnyClient {
  if (_client) return _client;

  _client = createClient(env.supabase.url, env.supabase.secret, {
    auth: {
      // Server clients never need session storage.
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return _client;
}
