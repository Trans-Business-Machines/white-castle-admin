"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type PropsWithChildren,
} from "react"
import { useRouter } from "next/navigation"
import { getHomeNavItem } from "@/components/dashboard/nav"
import { SessionTimeoutDialog } from "@/components/auth/session-timeout-dialog"
import { WorkspaceLoader } from "@/components/workspace-loader"
import * as authApi from "@/lib/api/auth"
import {
  clearAccessToken,
  getAccessToken,
  subscribeAccessToken,
} from "@/lib/auth-token"
import { onUnauthorized, refreshAccessToken } from "@/lib/axios"
import type { LoginValues } from "@/lib/schemas/auth"
import { getSessionExpiresAt, IDLE_TIMEOUT_MS, IDLE_WARNING_MS } from "@/lib/session"
import type { AuthUser } from "@/lib/types"

type AuthStatus = "loading" | "authenticated" | "unauthenticated"

interface AuthContextValue {
  user: AuthUser | null
  accessToken: string | null
  status: AuthStatus
  isLoggedIn: boolean
  login: (values: LoginValues) => Promise<AuthUser>
  logout: () => Promise<void>
  /** Re-fetches `/auth/me` and updates `user` (e.g. after a password change). */
  refreshUser: () => Promise<AuthUser>
}

/** Screens that are reachable without a session. */
const PUBLIC_ROUTES = ["/login", "/forgot-password", "/reset-password"]

export function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
}

/** Screen shown while an account still has a temporary password. */
export const CHANGE_PASSWORD_ROUTE = "/change-password"

/**
 * Every path the app actually serves. Anything else is a 404, and a 404 has to
 * render its own screen rather than being bounced to `/login` — keep this in
 * sync when a route is added under `app/(auth)` or `app/(dashboard)`.
 */
const APP_ROUTES = [
  "/",
  ...PUBLIC_ROUTES,
  CHANGE_PASSWORD_ROUTE,
  "/dashboard",
  "/requests",
  "/bookings",
  "/guests",
  "/units",
  "/payments",
  "/catering",
  "/reports",
  "/users",
  "/audits",
  "/settings",
  "/profile",
]

/** Whether the path matches a real route (so a signed-out visitor belongs at login). */
export function isAppRoute(pathname: string) {
  return APP_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
}

/** Signed-out visitors are sent to login from real routes only, never from a 404. */
function shouldRedirectToLogin(pathname: string) {
  return isAppRoute(pathname) && !isPublicRoute(pathname)
}

/**
 * Where a signed-in user should land: their role's home page (the dashboard,
 * or the bed and breakfast list for catering), unless they must first set a
 * new password.
 */
export function getLandingPath(
  user: Pick<AuthUser, "must_change_password" | "role">
) {
  return user.must_change_password
    ? CHANGE_PASSWORD_ROUTE
    : getHomeNavItem(user.role).href
}

export const AuthContext = createContext<AuthContextValue | null>(null)

const getServerToken = () => null

export function AuthProvider({ children }: PropsWithChildren) {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [status, setStatus] = useState<AuthStatus>("loading")
  const bootstrapped = useRef(false)
  const [timeoutDialog, setTimeoutDialog] = useState<{
    endsAt: number
    reason: "idle" | "absolute"
  } | null>(null)
  const lastActivityRef = useRef(Date.now())
  const idleTimerRef = useRef<number | null>(null)
  const warningTimerRef = useRef<number | null>(null)
  const signedIn = status === "authenticated" && user !== null

  // Mirrors the module-level token, so consumers re-render when the axios
  // interceptor refreshes it behind the scenes.
  const accessToken = useSyncExternalStore(
    subscribeAccessToken,
    getAccessToken,
    getServerToken
  )
  const sessionEndsAt = getSessionExpiresAt(accessToken)

  const endSession = useCallback(() => {
    clearAccessToken()
    setUser(null)
    setStatus("unauthenticated")
  }, [])

  // On load: trade the refresh cookie for an access token, load the profile,
  // then send the visitor to the right place.
  useEffect(() => {
    if (bootstrapped.current) return
    bootstrapped.current = true

    const pathname = window.location.pathname

    async function bootstrap() {
      try {
        await refreshAccessToken()
        const profile = await authApi.fetchMe()
        setUser(profile)
        setStatus("authenticated")
        const landing = getLandingPath(profile)
        const onChangePassword = pathname === CHANGE_PASSWORD_ROUTE
        if (pathname === "/" || isPublicRoute(pathname)) {
          router.replace(landing)
        } else if (profile.must_change_password && !onChangePassword) {
          router.replace(landing)
        } else if (onChangePassword && !profile.must_change_password) {
          router.replace(landing)
        }
      } catch {
        endSession()
        if (shouldRedirectToLogin(pathname)) router.replace("/login")
      }
    }

    void bootstrap()
  }, [router, endSession])

  // A refresh that fails mid-session (cookie expired or revoked) ends it.
  useEffect(() => {
    return onUnauthorized(() => {
      endSession()
      if (shouldRedirectToLogin(window.location.pathname)) {
        router.replace("/login")
      }
    })
  }, [router, endSession])

  const login = useCallback(async (values: LoginValues) => {
    await authApi.login(values)
    const profile = await authApi.fetchMe()
    setUser(profile)
    setStatus("authenticated")
    return profile
  }, [])

  const refreshUser = useCallback(async () => {
    const profile = await authApi.fetchMe()
    setUser(profile)
    return profile
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      endSession()
    }
  }, [endSession])

  const clearSessionTimers = useCallback(() => {
    if (idleTimerRef.current !== null) {
      window.clearTimeout(idleTimerRef.current)
      idleTimerRef.current = null
    }
    if (warningTimerRef.current !== null) {
      window.clearTimeout(warningTimerRef.current)
      warningTimerRef.current = null
    }
  }, [])

  const forceLogout = useCallback(async () => {
    setTimeoutDialog(null)
    clearSessionTimers()
    await logout()
    router.replace("/login")
  }, [clearSessionTimers, logout, router])

  const scheduleSessionTimers = useCallback(() => {
    clearSessionTimers()
    if (!signedIn) return

    const now = Date.now()
    lastActivityRef.current = now
    const idleAt = now + IDLE_TIMEOUT_MS
    const endsAt =
      sessionEndsAt !== null ? Math.min(idleAt, sessionEndsAt) : idleAt
    const reason: "idle" | "absolute" =
      sessionEndsAt !== null && sessionEndsAt <= idleAt ? "absolute" : "idle"

    warningTimerRef.current = window.setTimeout(
      () => setTimeoutDialog({ endsAt, reason }),
      Math.max(0, endsAt - IDLE_WARNING_MS - now)
    )
    idleTimerRef.current = window.setTimeout(
      () => void forceLogout(),
      Math.max(0, endsAt - now)
    )
  }, [clearSessionTimers, forceLogout, sessionEndsAt, signedIn])

  const staySignedIn = useCallback(() => {
    setTimeoutDialog(null)
    scheduleSessionTimers()
  }, [scheduleSessionTimers])

  // Reset the idle clock on real interaction, and enforce it when the tab
  // becomes visible again after being left unattended.
  useEffect(() => {
    if (!signedIn) {
      clearSessionTimers()
      setTimeoutDialog(null)
      return
    }

    const onActivity = () => {
      const now = Date.now()
      if (now - lastActivityRef.current < 1000) return
      setTimeoutDialog(null)
      scheduleSessionTimers()
    }

    const onVisibility = () => {
      if (document.visibilityState !== "visible") return
      const now = Date.now()
      if (
        now - lastActivityRef.current >= IDLE_TIMEOUT_MS ||
        (sessionEndsAt !== null && now >= sessionEndsAt)
      ) {
        void forceLogout()
        return
      }
      setTimeoutDialog(null)
      scheduleSessionTimers()
    }

    const events = [
      "mousedown",
      "pointerdown",
      "keydown",
      "touchstart",
      "scroll",
    ] as const
    events.forEach((event) =>
      window.addEventListener(event, onActivity, { passive: true })
    )
    document.addEventListener("visibilitychange", onVisibility)
    scheduleSessionTimers()

    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, onActivity)
      )
      document.removeEventListener("visibilitychange", onVisibility)
      clearSessionTimers()
    }
  }, [
    clearSessionTimers,
    forceLogout,
    scheduleSessionTimers,
    sessionEndsAt,
    signedIn,
  ])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      status,
      isLoggedIn: status === "authenticated" && user !== null,
      login,
      logout,
      refreshUser,
    }),
    [user, accessToken, status, login, logout, refreshUser]
  )

  return (
    <AuthContext.Provider value={value}>
      {status === "loading" ? <WorkspaceLoader /> : children}
      <SessionTimeoutDialog
        open={timeoutDialog !== null}
        endsAt={timeoutDialog?.endsAt ?? null}
        reason={timeoutDialog?.reason ?? "idle"}
        onStay={staySignedIn}
        onLogout={() => void forceLogout()}
      />
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }

  return context
}
