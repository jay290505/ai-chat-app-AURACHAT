/**
 * lib/supabaseClient.ts
 * ----------------------
 * Convenience re-export of the centralised Supabase client so that
 * all feature code can import from a single stable path:
 *
 *   import { supabase } from "@/lib/supabaseClient";
 *
 * The actual client is created and configured in lib/supabase/client.ts
 * (where session persistence, storage key, etc. are set up).
 */

export { supabaseClient as supabase, isSupabaseConfigured } from "./supabase/client";
