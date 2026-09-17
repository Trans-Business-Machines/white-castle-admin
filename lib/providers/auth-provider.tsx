"use client"

import {
  useContext,
  createContext,
  useState,
  type PropsWithChildren,
} from "react"

export interface AuthUser {
  name: string
  email: string
  role: string
}

interface AuthType {
  user: AuthUser | null
  isLoggedIn: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
}

// TODO: replace with the real session once the auth endpoints exist.
const MOCK_USER: AuthUser = {
  name: "Joyce Otieno",
  email: "joyce@whitecastle.co.ke",
  role: "Super Admin",
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const AuthContext = createContext<AuthType | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  // Defaults to the mock user so the dashboard is reachable without logging in.
  const [user, setUser] = useState<AuthUser | null>(MOCK_USER)

  const login = async () => {
    await wait(1500)
    setUser(MOCK_USER)
  }

  const logout = async () => {
    await wait(1500)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, isLoggedIn: user !== null, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used with an auth provider")
  }

  return context
}
