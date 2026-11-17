"use client"

import { type PropsWithChildren } from "react"
import { UnauthorizedCard } from "@/components/unauthorized-card"
import { hasAnyPermission, hasPermission } from "@/lib/roles"
import { useAuth } from "@/providers/auth-provider"

interface Props extends PropsWithChildren {
  /** Permission slug required to see the children. */
  permission?: string
  /** Alternative: any one of these permissions is enough. */
  anyPermission?: readonly string[]
  /** Describes the protected screen in the unauthorized notice. */
  area: string
}

/**
 * Renders children only when the signed-in user holds the required
 * permission; everyone else sees an "Unauthorized access" notice instead.
 * Sits inside `RequireAuth`, so `user` is already resolved by this point.
 */
function RequirePermission({
  permission,
  anyPermission,
  area,
  children,
}: Props) {
  const { user } = useAuth()

  if (!user) return null
  const allowed = anyPermission
    ? hasAnyPermission(user.permissions, anyPermission)
    : permission
      ? hasPermission(user.permissions, permission)
      : false

  if (!allowed) {
    return <UnauthorizedCard area={area} />
  }

  return children
}

export { RequirePermission }
