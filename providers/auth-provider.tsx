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
import { WorkspaceLoader } from "@/components/workspace-loader"
import * as authApi from "@/lib/api/auth"
import {
  clearAccessToken,
  getAccessToken,
  subscribeAccessToken,
} from "@/lib/auth-token"
import { onUnauthorized, refreshAccessToken } from "@/lib/axios"
import type { LoginValues } from "@/lib/schemas/auth"
import type { AuthUser } from "@/lib/types"

type AuthStatus = "loading" | "authenticated" | "unauthenticated"

interface AuthContextValue {
  user: AuthUser | null
  accessToken: string | null
  status: AuthStatus
  isLoggedIn: boolean
  login: (values: LoginValues) => Promise<AuthUser>
  logout: () => Promise<void>
}

/** Screens that are reachable without a session. */
const PUBLIC_ROUTES = ["/login", "/forgot-password", "/reset-password"]

export function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
}

export const AuthContext = createContext<AuthContextValue | null>(null)

const getServerToken = () => null

export function AuthProvider({ children }: PropsWithChildren) {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [status, setStatus] = useState<AuthStatus>("loading")
  const bootstrapped = useRef(false)

  // Mirrors the module-level token, so consumers re-render when the axios
  // interceptor refreshes it behind the scenes.
  const accessToken = useSyncExternalStore(
    subscribeAccessToken,
    getAccessToken,
    getServerToken
  )

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
        if (pathname === "/" || isPublicRoute(pathname)) {
          router.replace("/dashboard")
        }
      } catch {
        endSession()
        if (!isPublicRoute(pathname)) router.replace("/login")
      }
    }

    void bootstrap()
  }, [router, endSession])

  // A refresh that fails mid-session (cookie expired or revoked) ends it.
  useEffect(() => {
    return onUnauthorized(() => {
      endSession()
      if (!isPublicRoute(window.location.pathname)) router.replace("/login")
    })
  }, [router, endSession])

  const login = useCallback(async (values: LoginValues) => {
    await authApi.login(values)
    const profile = await authApi.fetchMe()
    setUser(profile)
    setStatus("authenticated")
    return profile
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      endSession()
    }
  }, [endSession])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      status,
      isLoggedIn: status === "authenticated" && user !== null,
      login,
      logout,
    }),
    [user, accessToken, status, login, logout]
  )

  return (
    <AuthContext.Provider value={value}>
      {status === "loading" ? <WorkspaceLoader /> : children}
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
