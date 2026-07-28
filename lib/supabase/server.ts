import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Session-aware Supabase client for use in Server Components, Server Actions,
 * and Route Handlers. Reads/writes the auth cookies of the current request.
 * Used only to check *who* is logged in (admin login) — never for data access,
 * since RLS only grants public read on published rows (see supabase/migrations).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component with no request context to write to.
            // Safe to ignore when proxy.ts is refreshing the session on every request.
          }
        },
      },
    }
  );
}
