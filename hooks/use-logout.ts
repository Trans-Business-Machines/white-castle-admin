"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/providers/auth-provider"

/**
 * Shared sign-out action for the account menus. Tracks its own pending flag so
 * each trigger can show a spinner without lifting state.
 */
export function useLogout() {
  const router = useRouter()
  const { logout } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function handleLogout() {
    setIsLoggingOut(true)
    try {
      await logout()
      router.replace("/login")
    } finally {
      setIsLoggingOut(false)
    }
  }

  return { isLoggingOut, logout: handleLogout }
}
