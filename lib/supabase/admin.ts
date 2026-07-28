import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Privileged Supabase client using the service role key — bypasses Row Level
 * Security. This is the ONLY client the catalog/order data layer (lib/db) and
 * storage layer (lib/storage) use, since this app has a single trusted admin
 * rather than per-user RLS policies. Never import this outside server-only
 * code (route handlers, server actions, the proxy is fine too).
 *
 * This is also the intended swap point for an AWS migration: replace with a
 * plain `pg` Pool against RDS and keep the same function signatures in lib/db.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
