import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios"
import {
  clearAccessToken,
  getAccessToken,
  pickAccessToken,
  setAccessToken,
} from "@/lib/auth-token"

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

/**
 * Authenticated client. Every request carries the in-memory access token; a
 * 401 triggers a single refresh (shared between concurrent failures) and the
 * original request is replayed with the new token.
 */
export const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
})

axiosInstance.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined
    const status = error.response?.status

    if (!config || status !== 401 || config._retry) {
      return Promise.reject(error)
    }

    config._retry = true

    try {
      const token = await refreshAccessToken()
      config.headers.Authorization = `Bearer ${token}`
      return axiosInstance(config)
    } catch {
      // Refresh cookie is gone or expired: the session is over.
      notifyUnauthorized()
      return Promise.reject(error)
    }
  }
)

let refreshPromise: Promise<string> | null = null

/**
 * Exchanges the HTTP-only refresh cookie for a new access token and stores it.
 * Uses the bare axios export (not `axiosInstance`) so it is never intercepted
 * or retried. Concurrent callers share the same in-flight request.
 */
export function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_BASE}/auth/refresh`, null, { withCredentials: true })
      .then((response) => {
        const token = pickAccessToken(response.data)
        setAccessToken(token)
        return token
      })
      .catch((error) => {
        clearAccessToken()
        throw error
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

type UnauthorizedListener = () => void
const unauthorizedListeners = new Set<UnauthorizedListener>()

/** Subscribe to "the session could not be recovered" events. */
export function onUnauthorized(listener: UnauthorizedListener) {
  unauthorizedListeners.add(listener)
  return () => {
    unauthorizedListeners.delete(listener)
  }
}

function notifyUnauthorized() {
  clearAccessToken()
  unauthorizedListeners.forEach((listener) => listener())
}
