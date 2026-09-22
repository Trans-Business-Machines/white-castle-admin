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
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-e746e37d303f48acb02b0b81815e4b23.r2.dev",
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
