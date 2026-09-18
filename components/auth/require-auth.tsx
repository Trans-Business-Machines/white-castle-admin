"use client"

import { useEffect, type PropsWithChildren } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/providers/auth-provider"

/** Renders children only for a signed-in user; everyone else goes to login. */
function RequireAuth({ children }: PropsWithChildren) {
  const router = useRouter()
  const { status } = useAuth()

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login")
  }, [status, router])

  if (status !== "authenticated") return null

  return children
}

export { RequireAuth }
