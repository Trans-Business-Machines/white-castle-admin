"use client"

import { type PropsWithChildren } from "react"
import { UnauthorizedCard } from "@/components/unauthorized-card"
import { roleSlug } from "@/lib/roles"
import { useAuth } from "@/providers/auth-provider"

interface Props extends PropsWithChildren {
  /** Role slugs allowed to see the children. */
  roles: readonly string[]
  /** Describes the protected screen in the unauthorized notice. */
  area: string
}

/**
 * Renders children only when the signed-in user's role is in `roles`;
 * everyone else sees an "Unauthorized access" notice instead. Sits inside
 * `RequireAuth`, so `user` is already resolved by the time this renders.
 */
function RequireRole({ roles, area, children }: Props) {
  const { user } = useAuth()

  if (!user) return null
  if (!roles.includes(roleSlug(user.role))) {
    return <UnauthorizedCard area={area} />
  }

  return children
}

export { RequireRole }
