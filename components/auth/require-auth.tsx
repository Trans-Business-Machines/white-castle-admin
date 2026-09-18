"use client"

import { useEffect, type PropsWithChildren } from "react"
import { useRouter } from "next/navigation"
import { CHANGE_PASSWORD_ROUTE, useAuth } from "@/providers/auth-provider"

/**
 * Renders children only for a signed-in user whose password is not temporary.
 * Signed-out visitors go to login; users flagged `must_change_password` are
 * sent to set a new password first.
 */
function RequireAuth({ children }: PropsWithChildren) {
  const router = useRouter()
  const { status, user } = useAuth()
  const mustChangePassword = user?.must_change_password ?? false

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login")
    else if (status === "authenticated" && mustChangePassword) {
      router.replace(CHANGE_PASSWORD_ROUTE)
    }
  }, [status, mustChangePassword, router])

  if (status !== "authenticated" || mustChangePassword) return null

  return children
}

export { RequireAuth }
