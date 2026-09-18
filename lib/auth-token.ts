/**
 * In-memory access token store.
 *
 * The token deliberately never touches localStorage or cookies: it lives in
 * this module for the lifetime of the tab and is re-obtained on load via the
 * HTTP-only refresh cookie. Listeners let React state stay in sync when the
 * axios interceptor refreshes the token outside of a render.
 */

type Listener = (token: string | null) => void

let accessToken: string | null = null
const listeners = new Set<Listener>()

export function getAccessToken() {
  return accessToken
}

export function setAccessToken(token: string | null) {
  if (token === accessToken) return
  accessToken = token
  listeners.forEach((listener) => listener(token))
}

export function clearAccessToken() {
  setAccessToken(null)
}

export function subscribeAccessToken(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/**
 * Reads the access token out of a login / refresh response body. The backend
 * is FastAPI-style and expected to use `access_token`; the other keys are
 * tolerated so a rename on the server doesn't silently log everyone out.
 */
export function pickAccessToken(data: unknown): string {
  if (data && typeof data === "object") {
    const body = data as Record<string, unknown>
    const token = body.access_token ?? body.accessToken ?? body.token
    if (typeof token === "string" && token.length > 0) return token
  }
  throw new Error("Auth response did not include an access token")
}
