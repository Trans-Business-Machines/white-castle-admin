"use client"

import {
  AUTH_NOT_FOUND,
  DASHBOARD_NOT_FOUND,
  NotFoundView,
} from "@/components/not-found-view"
import { useAuth } from "@/providers/auth-provider"

/**
 * Next routes every unmatched URL here, outside both route groups, so this
 * screen picks its own copy: a signed-in user is sent back to the dashboard,
 * everyone else to the sign-in screen.
 */
export default function NotFound() {
  const { isLoggedIn } = useAuth()

  return (
    <main className="flex min-h-svh items-center justify-center bg-porcelain px-4 py-12 dark:bg-background">
      <NotFoundView
        className="max-w-md"
        {...(isLoggedIn ? DASHBOARD_NOT_FOUND : AUTH_NOT_FOUND)}
      />
    </main>
  )
}
