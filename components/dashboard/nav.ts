import {
  Bed,
  Calendars,
  ChartColumnBig,
  NotebookPen,
  Settings,
  Sparkles,
  UserCog,
  Users,
  Banknote,
  Coffee,
  FileChartColumn,
  ScrollText,
  type LucideIcon,
} from "lucide-react"
import { hasAnyPermission, hasPermission } from "@/lib/roles"

export interface NavItem {
  title: string
  description: string
  href: string
  icon: LucideIcon
  /** Permission required to see and open the page. */
  permission?: string
  /** Alternative: any one of these permissions opens the page. */
  anyPermission?: readonly string[]
}

export const dashboardNav: NavItem[] = [
  {
    title: "Dashboard",
    description: "Live room status across the property",
    href: "/dashboard",
    icon: ChartColumnBig,
    permission: "dashboard:view",
  },
  {
    title: "Requests",
    description: "Booking requests waiting for approval",
    href: "/requests",
    icon: NotebookPen,
    permission: "bookings:view",
  },
  {
    title: "Bookings",
    description: "Confirmed stays, arrivals and departures",
    href: "/bookings",
    icon: Calendars,
    permission: "bookings:view",
  },
  {
    title: "Guest Management",
    description: "Everyone who has stayed at the property",
    href: "/guests",
    icon: Users,
    permission: "guests:view",
  },
  {
    title: "Housekeeping",
    description: "Cleaning queue and rooms waiting to be turned over",
    href: "/housekeeping",
    icon: Sparkles,
    permission: "housekeeping:view",
  },
  {
    title: "Units",
    description: "Rooms, rates and availability",
    href: "/units",
    icon: Bed,
    permission: "units:view",
  },
  {
    title: "Payments",
    description: "Booking payments and confirmations",
    href: "/payments",
    icon: Banknote,
    permission: "payments:view",
  },
  {
    title: "Catering",
    description: "Guests on the breakfast list",
    href: "/catering",
    icon: Coffee,
    permission: "catering:view",
  },
  {
    title: "Reports",
    description: "Bookings, revenue and guest reports on demand",
    href: "/reports",
    icon: FileChartColumn,
    permission: "reports:view",
  },
  {
    title: "User Management",
    description: "Staff accounts, roles and permissions",
    href: "/users",
    icon: UserCog,
    permission: "users:view",
  },
  {
    title: "Audit Log",
    description: "Sign-ins, account changes and activity across services",
    href: "/audits",
    icon: ScrollText,
    anyPermission: ["audit:view", "reports:audit"],
  },
]

export const profileNav: NavItem = {
  title: "Profile",
  description: "Your account details and password",
  href: "/profile",
  icon: Users,
}

/** Lives in the sidebar footer rather than the main list. */
export const settingsNav: NavItem = {
  title: "Settings",
  description: "Motel-wide rules, deadlines and contacts",
  href: "/settings",
  icon: Settings,
  permission: "settings:view",
}

export function findNavItem(pathname: string) {
  return [...dashboardNav, settingsNav, profileNav].find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  )
}

/** Whether a nav item should be shown to a user with these permissions. */
export function canSeeNavItem(
  item: NavItem,
  permissions: readonly string[] | undefined
) {
  if (item.anyPermission) {
    return hasAnyPermission(permissions, item.anyPermission)
  }
  if (item.permission) return hasPermission(permissions, item.permission)
  return true
}

/**
 * Whether a user may open `pathname`: the page's nav item decides, so hiding
 * a link and blocking its route can't drift apart. Paths outside the nav
 * (404s) are left for the not-found screen.
 */
export function canAccessPath(
  pathname: string,
  permissions: readonly string[] | undefined
) {
  const item = findNavItem(pathname)
  return !item || canSeeNavItem(item, permissions)
}

/**
 * Where a user starts: the first nav page their permissions can open.
 * Falls back to the profile when they have no module access yet.
 */
export function getHomeNavItem(permissions: readonly string[] | undefined) {
  return (
    dashboardNav.find((item) => canSeeNavItem(item, permissions)) ?? profileNav
  )
}
