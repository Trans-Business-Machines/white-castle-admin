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
import { useAuth } from "@/providers/auth-provider"

// TODO: read the pending request count from the API.
const PENDING_REQUESTS = 9

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
                    item.href === "/requests" && PENDING_REQUESTS > 0
                      ? PENDING_REQUESTS
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
                          className={cn(
                            "top-3 right-3 h-5 min-w-5 rounded-full bg-amber-400 px-1.5 text-xs font-semibold text-brand-navy group-data-[collapsible=icon]:flex",
                            labelClassName
                          )}
                        >
                          {badge}
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
