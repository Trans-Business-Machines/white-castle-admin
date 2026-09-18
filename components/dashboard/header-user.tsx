"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown, Loader, LogOut, UserRound } from "lucide-react"
import { cn } from "cn"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { useLogout } from "@/hooks/use-logout"
import { getInitials } from "@/lib/format"
import { useAuth } from "@/providers/auth-provider"

const menuItemClassName =
  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium outline-none transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0"

/** Account menu shown in the dashboard header, beside the date. */
function HeaderUser() {
  const { user } = useAuth()
  const { isLoggingOut, logout } = useLogout()
  const [open, setOpen] = useState(false)

  if (!user) return null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={`Account menu for ${user.full_name}`}
        className="group rou flex h-10 max-w-64 items-center gap-2.5 px-2 rounded-xl text-left transition-colors outline-none hover:bg-porcelain focus-visible:ring-3 focus-visible:ring-brand-azure/20 sm:pr-3 dark:hover:bg-muted data-open:bg-porcelain dark:data-open:bg-muted"
      >
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-brand-navy via-brand-azure to-brand-teal text-xs font-semibold text-white"
        >
          {getInitials(user.full_name)}
        </span>
        <span className="hidden min-w-0 flex-1 grid-cols-1 leading-tight sm:grid">
          <span className="truncate text-sm font-semibold text-foreground">
            {user.full_name}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {user.email}
          </span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className="hidden size-4 shrink-0 text-muted-foreground transition-transform group-data-open:rotate-180 sm:block"
        />
      </PopoverTrigger>

      <PopoverContent
        side="bottom"
        align="end"
        sideOffset={10}
        className="w-64 gap-0 bg-porcelain p-1.5 shadow-lg ring-1 ring-foreground/10 dark:bg-popover"
      >
        <div className="grid gap-0.5 px-2.5 py-2">
          <p className="truncate text-sm font-semibold text-foreground">
            {user.full_name}
          </p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          <p className="mt-1.5 w-fit rounded-full bg-brand-azure/10 px-2 py-0.5 text-xs font-semibold text-brand-azure capitalize">
            {user.role}
          </p>
        </div>

        <Separator className="my-1.5" />

        <nav className="grid gap-0.5">
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className={cn(
              menuItemClassName,
              "text-foreground hover:bg-brand-azure/10 hover:text-brand-azure focus-visible:bg-brand-azure/10 focus-visible:text-brand-azure"
            )}
          >
            <UserRound aria-hidden="true" />
            Profile
          </Link>
          <button
            type="button"
            disabled={isLoggingOut}
            onClick={logout}
            className={cn(
              menuItemClassName,
              "text-destructive hover:bg-destructive/10 focus-visible:bg-destructive/10"
            )}
          >
            {isLoggingOut ? (
              <Loader aria-hidden="true" className="animate-spin" />
            ) : (
              <LogOut aria-hidden="true" />
            )}
            {isLoggingOut ? "Signing out" : "Sign out"}
          </button>
        </nav>
      </PopoverContent>
    </Popover>
  )
}

export { HeaderUser }
