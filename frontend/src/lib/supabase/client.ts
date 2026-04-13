/**
 * lib/supabase/client.ts
 * ----------------------
 * Browser-side Supabase client built with `createBrowserClient` from
 * `@supabase/ssr`. This is REQUIRED for Next.js App Router so that the
 * PKCE code-verifier is stored in cookies (not localStorage), meaning it
 * survives the OAuth redirect back from the provider.
 *
 * Using the plain `createClient` from `@supabase/supabase-js` breaks the
 * PKCE flow in Next.js: "PKCE code verifier not found in storage."
 */

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

if (!isSupabaseConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are not set. Running in demo mode without backend.",
  );
}

/**
 * Singleton browser client.
 * `createBrowserClient` from `@supabase/ssr` stores the PKCE verifier in
 * cookies, which are available after the OAuth redirect — unlike localStorage
 * which is lost in some browser environments mid-redirect.
 */
export const supabaseClient = isSupabaseConfigured
  ? createBrowserClient<Database>(supabaseUrl!, supabaseAnonKey!)
  : null;
