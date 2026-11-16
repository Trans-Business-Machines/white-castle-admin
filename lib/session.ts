/** Session lifetime helpers shared by the auth provider and timeout dialog. */

/** Idle lock after 30 minutes without interaction. */
export const IDLE_TIMEOUT_MS = 30 * 60 * 1000

/** Show the "still there?" warning one minute before the idle lock. */
export const IDLE_WARNING_MS = 60 * 1000

/** Decode a JWT payload without verifying it — the server verifies on use. */
export function decodeJwtPayload(token: string | null) {
  if (!token) return null
  const parts = token.split(".")
  if (parts.length !== 3) return null
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    )
    return JSON.parse(atob(padded)) as Record<string, unknown>
  } catch {
    return null
  }
}

/** Absolute session expiry from the access token, in milliseconds. */
export function getSessionExpiresAt(token: string | null): number | null {
  const payload = decodeJwtPayload(token)
  const value = payload?.session_expires_at
  if (typeof value === "number") return value * 1000
  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed * 1000 : null
  }
  return null
}
