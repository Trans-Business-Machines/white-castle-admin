"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { cn } from "cn"
import { canSeeNavItem, dashboardNav } from "@/components/dashboard/nav"
import { SidebarUser } from "@/components/dashboard/sidebar-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { useBookingRequests } from "@/hooks/use-booking-requests"
import { useAuth } from "@/providers/auth-provider"

/** Above this the badge would outgrow the rail, so it counts up to "99+". */
const MAX_BADGE_COUNT = 99

/**
 * Labels fade rather than toggling `display`, so nothing pops while the rail
 * width animates. Collapsing fades out fast; expanding waits for the rail to
 * widen before fading the label back in.
 */
const labelClassName =
  "transition-opacity duration-200 delay-100 ease-out group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:delay-0 group-data-[collapsible=icon]:duration-100"

/** 48px square, centered in the 80px rail (5rem - 2 * px-4). */
const collapsedButtonClassName =
  "group-data-[collapsible=icon]:size-12! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:p-0!"

function AppSidebar() {
  const pathname = usePathname()
  const { toggleSidebar } = useSidebar()
  const { user } = useAuth()
  // Shares its query with the /requests table, so approving or rejecting a
  // request drops the count here without a second fetch.
  const { count: pendingRequests } = useBookingRequests()
  const visibleNav = dashboardNav.filter((item) =>
    canSeeNavItem(item, user?.role)
  )

  return (
    <Sidebar collapsible="icon" className="border-none">
      <div
        className={cn(
          "flex h-full flex-col bg-linear-to-b from-brand-navy via-brand-azure to-brand-teal text-white",
          "[--sidebar-accent-foreground:#fff] [--sidebar-accent:rgb(255_255_255/0.16)] [--sidebar-border:rgb(255_255_255/0.15)] [--sidebar-foreground:#fff] [--sidebar-ring:#fff]"
        )}
      >
        <SidebarHeader className="px-4 py-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
              className="mx-1 flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/15 transition-colors outline-none hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <Menu aria-hidden="true" className="size-5" />
            </button>
            <Link
              href="/dashboard"
              className={cn(
                "overflow-hidden font-heading text-lg font-bold tracking-[0.12em] whitespace-nowrap uppercase",
                labelClassName
              )}
            >
              White Castle
            </Link>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-4">
          <SidebarGroup className="p-0">
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5">
                {visibleNav.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`)
                  const badge =
                    item.href === "/requests" && pendingRequests > 0
                      ? Math.min(pendingRequests, MAX_BADGE_COUNT + 1)
                      : null

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        className={cn(
                          "h-11 gap-3 rounded-lg px-3 text-[0.9375rem] text-white/85 hover:text-white data-active:bg-white/16 data-active:text-white [&_svg]:size-5",
                          collapsedButtonClassName
                        )}
                      >
                        <Link href={item.href}>
                          <item.icon aria-hidden="true" />
                          <span className={labelClassName}>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                      {badge !== null ? (
                        <SidebarMenuBadge
                          aria-label={`${pendingRequests} pending`}
                          className={cn(
                            // `top-1/2!` beats the peer-driven `top-1.5` the
                            // base badge sets, so it centres on the nav link.
                            "top-1/2! right-3 h-5 min-w-5 -translate-y-1/2 rounded-full bg-rose-600 px-1.5 text-xs font-semibold text-white group-data-[collapsible=icon]:flex",
                            labelClassName
                          )}
                        >
                          {badge > MAX_BADGE_COUNT
                            ? `${MAX_BADGE_COUNT}+`
                            : badge}
                        </SidebarMenuBadge>
                      ) : null}
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-white/15 px-4 py-3">
          <SidebarUser
            className={collapsedButtonClassName}
            labelClassName={labelClassName}
          />
        </SidebarFooter>
      </div>
      <SidebarRail />
    </Sidebar>
  )
}

export { AppSidebar }
