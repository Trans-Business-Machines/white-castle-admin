"use client"

import { type PropsWithChildren } from "react"
import { usePathname } from "next/navigation"
import { canAccessPath, findNavItem } from "@/components/dashboard/nav"
import { UnauthorizedCard } from "@/components/unauthorized-card"
import { useAuth } from "@/providers/auth-provider"

/**
 * Blocks every dashboard route the signed-in role can't open, using the same
 * nav `roles` that hide its sidebar link — so typing a hidden page's address
 * shows the "Unauthorized access" notice instead of the page. Sits inside
 * `RequireAuth`, so `user` is already resolved by the time this renders.
 */
function RequireRouteAccess({ children }: PropsWithChildren) {
  const pathname = usePathname()
  const { user } = useAuth()

  if (!user) return null
  if (!canAccessPath(pathname, user.role)) {
    const page = findNavItem(pathname)
    return <UnauthorizedCard area={page?.title.toLowerCase() ?? "this page"} />
  }

  return children
}

export { RequireRouteAccess }
