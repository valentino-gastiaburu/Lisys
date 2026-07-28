import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Re-checks admin auth inside Server Components/Actions. proxy.ts already
 * blocks unauthenticated requests to /admin, but Next.js docs warn that
 * Server Actions are reachable directly via POST even if their page route
 * is excluded by the proxy matcher — so every admin mutation calls this too.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect("/admin/login");
  }

  return user;
}
