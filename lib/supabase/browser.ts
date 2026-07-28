import { createBrowserClient } from "@supabase/ssr";

/** Supabase client for Client Components (used only by the admin login form). */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
