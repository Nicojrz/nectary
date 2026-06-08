/**
 * Supabase Client — Browser (Client Components)
 *
 * Use this client in Client Components (use client).
 * It uses the anon key and respects RLS policies.
 *
 * Usage:
 *   import { supabase } from "@/lib/supabase/client";
 *   const { data } = await supabase.from("sparks").select("*");
 */
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
