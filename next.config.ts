import type { NextConfig } from "next";

// next/image blocks any remote domain that isn't explicitly allow-listed —
// without this, product cover images from Supabase Storage silently fail
// to load (broken image icon) in production.
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

// Only applied in production — dev mode (Turbopack HMR, eval-based source
// maps) needs looser rules than this, and the built app is what actually
// ships. 'unsafe-inline' on script-src is required because Next's own App
// Router hydration payload ships as inline <script> tags with no nonce
// wired up; everything else here is as strict as the app allows (no
// dangerouslySetInnerHTML/eval anywhere in the codebase as of this writing,
// so the residual risk from allowing inline scripts is low — CSP here is
// defense-in-depth, not the only line of defense).
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: ${supabaseHostname ? `https://${supabaseHostname}` : ""}`,
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
  async headers() {
    if (process.env.NODE_ENV !== "production") return [];
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
