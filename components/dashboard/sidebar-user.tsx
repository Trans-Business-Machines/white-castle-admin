"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader, LogOut, UserRound } from "lucide-react"
import { cn } from "cn"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/lib/providers/auth-provider"

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

const menuItemClassName =
  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium text-white outline-none transition-colors hover:bg-white/15 focus-visible:bg-white/15 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0"

function SidebarUser({
  className,
  labelClassName,
}: {
  className?: string
  labelClassName?: string
}) {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  if (!user) return null

  async function handleLogout() {
    setIsLoggingOut(true)
    try {
      await logout()
      router.replace("/login")
    } finally {
      setIsLoggingOut(false)
    }
  }

  const initials = getInitials(user.name)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <SidebarMenu>
        <SidebarMenuItem>
          <PopoverTrigger asChild>
            <SidebarMenuButton
              size="lg"
              tooltip={user.name}
              className={cn(
                "gap-3 rounded-lg px-1.5 hover:bg-white/10 data-open:bg-white/10",
                className
              )}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-semibold">
                {initials}
              </span>
              <span
                className={cn(
                  "grid min-w-0 flex-1 overflow-hidden leading-tight",
                  labelClassName
                )}
              >
                <span className="truncate text-sm font-semibold">
                  {user.name}
                </span>
                <span className="truncate text-xs text-white/70">
                  {user.role}
                </span>
              </span>
            </SidebarMenuButton>
          </PopoverTrigger>
        </SidebarMenuItem>
      </SidebarMenu>

      <PopoverContent
        side="top"
        align="start"
        sideOffset={8}
        className="w-56 border-0 bg-linear-to-b from-brand-navy via-brand-azure to-brand-teal p-1.5 text-white shadow-xl ring-1 ring-white/15"
      >
        <nav className="grid gap-0.5">
          <Link
            href="/profile"
            className={menuItemClassName}
            onClick={() => setOpen(false)}
          >
            <UserRound aria-hidden="true" />
            Profile
          </Link>
          <button
            type="button"
            className={`${menuItemClassName} text-red-200 hover:bg-red-400/25 focus-visible:bg-red-400/25`}
            disabled={isLoggingOut}
            onClick={handleLogout}
          >
            {isLoggingOut ? (
              <Loader aria-hidden="true" className="animate-spin" />
            ) : (
              <LogOut aria-hidden="true" />
            )}
            {isLoggingOut ? "Logging out" : "Log out"}
          </button>
        </nav>
      </PopoverContent>
    </Popover>
  )
}

export { SidebarUser }
