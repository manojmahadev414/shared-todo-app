import type { NextConfig } from "next";

// Security headers applied to every response.
// - X-Frame-Options + CSP frame-ancestors: clickjacking protection (deny framing).
// - X-Content-Type-Options: stop MIME sniffing.
// - Referrer-Policy: avoid leaking full URLs cross-origin.
// - Permissions-Policy: disable powerful browser features the app does not use.
// - CSP here is a conservative baseline (base-uri / form-action / object-src /
//   frame-ancestors). It intentionally omits a strict script-src: that needs
//   per-request nonces wired through middleware and would otherwise break Next's
//   inline runtime and third-party sign-in. frame-ancestors still gives full
//   clickjacking defence-in-depth alongside X-Frame-Options.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
