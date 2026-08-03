import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { COUNTRY_COOKIE } from "@/lib/geo";

// Netlify's Next.js runtime runs this as an Edge Function and shims the old
// Vercel-style `request.geo`, populated from its own edge network — no
// external IP lookup needed. Not part of Next's own NextRequest type
// anymore (Next deprecated it), so it's read via this narrow extension.
interface RequestWithGeo extends NextRequest {
  geo?: { country?: string };
}

/**
 * Next.js 16 renamed `middleware.ts` to `proxy.ts` (same runtime, same
 * execution model — just a rename to avoid the Express "middleware" mix-up).
 * This refreshes the Supabase session cookie on every request, blocks
 * unauthenticated/non-admin access to /admin before it renders, and stashes
 * the visitor's country in a cookie so pages/routes can decide whether to
 * show soles alongside dollars without redoing the geo lookup themselves.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            for (const { name, value } of cookiesToSet) {
              request.cookies.set(name, value);
            }
            response = NextResponse.next({ request });
            for (const { name, value, options } of cookiesToSet) {
              response.cookies.set(name, value, options);
            }
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isLoginPage = pathname === "/admin/login";
    const isAdmin = user?.email === process.env.ADMIN_EMAIL;

    if (pathname.startsWith("/admin") && !isLoginPage && !isAdmin) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    if (isLoginPage && isAdmin) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  if (!request.cookies.get(COUNTRY_COOKIE)) {
    const country = (request as RequestWithGeo).geo?.country ?? "";
    response.cookies.set(COUNTRY_COOKIE, country, {
      maxAge: 60 * 60 * 24,
      path: "/",
      // Only ever read server-side (lib/geo.ts) — no client script needs
      // it, so keep it out of `document.cookie` entirely.
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
