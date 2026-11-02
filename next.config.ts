import type { NextConfig } from "next"

/**
 * Upstream API the Next server proxies to. The browser only ever talks to
 * `/api/*` on this app's own origin, so the backend's HTTP-only refresh cookie
 * (SameSite=Lax) is stored and sent as a same-site cookie. Calling the backend
 * origin directly from the browser would be cross-site and the cookie would
 * never be attached to `/auth/refresh`.
 */
const API_PROXY_TARGET = process.env.API_PROXY_TARGET

const nextConfig: NextConfig = {
  experimental: {
    // The API is reached through this app's /api rewrite. Next buffers the
    // proxied body and caps it at 10 MB by default, which broke room-photo
    // uploads larger than that.
    proxyClientMaxBodySize: "100mb",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-3a291edffba94754a3b71913cc6ebb13.r2.dev",
      },
    ],
  },
  async rewrites() {
    if (!API_PROXY_TARGET) return []
    return [
      {
        source: "/api/:path*",
        destination: `${API_PROXY_TARGET.replace(/\/$/, "")}/:path*`,
      },
    ]
  },
}

export default nextConfig
