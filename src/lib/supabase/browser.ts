/**
 * Browser-side Supabase client.
 *
 * Uses the publishable key (NEXT_PUBLIC_*) so it is safe to ship to the
 * browser. Only allows operations that pass Row Level Security policies.
 *
 * Import this module in Client Components only.
 */
"use client";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

if (!supabaseUrl || !supabasePublishableKey) {
  // Warn loudly in the browser console during development.
  console.warn(
    "[supabase/browser] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing. " +
      "Check your .env file.",
  );
}

/** Singleton browser client — reused across renders. */
let _browserClient: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseBrowser(): ReturnType<
  typeof createClient<Database>
> {
  if (_browserClient) return _browserClient;
  _browserClient = createClient<Database>(supabaseUrl, supabasePublishableKey);
  return _browserClient;
}
