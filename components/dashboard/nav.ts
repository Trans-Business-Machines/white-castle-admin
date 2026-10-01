import {
  Bed,
  Calendars,
  ChartColumnBig,
  NotebookPen,
  Settings,
  UserCog,
  Users,
  Banknote,
  Coffee,
  FileChartColumn,
  ScrollText,
  type LucideIcon,
} from "lucide-react"
import {
  AUDIT_ROLES,
  CATERING_ROLES,
  GUESTS_ROLES,
  OPERATIONS_ROLES,
  PAYMENTS_ROLES,
  REPORTS_ROLES,
  SETTINGS_ROLES,
  UNITS_ROLES,
  USER_MANAGEMENT_ROLES,
  hasRole,
  type RoleName,
} from "@/lib/roles"

export interface NavItem {
  title: string
  description: string
  href: string
  icon: LucideIcon
  roles?: readonly RoleName[]
}

export const dashboardNav: NavItem[] = [
  {
    title: "Dashboard",
    description: "Live room status across the property",
    href: "/dashboard",
    icon: ChartColumnBig,
    roles: OPERATIONS_ROLES,
  },
  {
    title: "Requests",
    description: "Booking requests waiting for approval",
    href: "/requests",
    icon: NotebookPen,
    roles: OPERATIONS_ROLES,
  },
  {
    title: "Bookings",
    description: "Confirmed stays, arrivals and departures",
    href: "/bookings",
    icon: Calendars,
    roles: OPERATIONS_ROLES,
  },
  {
    title: "Guest Management",
    description: "Everyone who has stayed at the property",
    href: "/guests",
    icon: Users,
    roles: GUESTS_ROLES,
  },
  {
    title: "Units",
    description: "Rooms, rates and availability",
    href: "/units",
    icon: Bed,
    roles: UNITS_ROLES,
  },
  {
    title: "Payments",
    description: "Booking payments and confirmations",
    href: "/payments",
    icon: Banknote,
    roles: PAYMENTS_ROLES,
  },
  {
    title: "Catering",
    description: "Guests on the breakfast list",
    href: "/catering",
    icon: Coffee,
    roles: CATERING_ROLES,
  },
  {
    title: "Reports",
    description: "Bookings, revenue and guest reports on demand",
    href: "/reports",
    icon: FileChartColumn,
    roles: REPORTS_ROLES,
  },
  {
    title: "User Management",
    description: "Staff account's and permissions",
    href: "/users",
    icon: UserCog,
    roles: USER_MANAGEMENT_ROLES,
  },
  {
    title: "Audit Log",
    description: "Sign-ins, account changes and activity across services",
    href: "/audits",
    icon: ScrollText,
    roles: AUDIT_ROLES,
  },
]

export const profileNav: NavItem = {
  title: "Profile",
  description: "Your account details and password",
  href: "/profile",
  icon: Users,
}

/** Lives in the sidebar footer rather than the main list; super admins only. */
export const settingsNav: NavItem = {
  title: "Settings",
  description: "Motel-wide rules, deadlines and contacts",
  href: "/settings",
  icon: Settings,
  roles: SETTINGS_ROLES,
}

export function findNavItem(pathname: string) {
  return [...dashboardNav, settingsNav, profileNav].find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  )
}

/** Whether a nav item should be shown to a user with the given role. */
export function canSeeNavItem(item: NavItem, role: string | undefined) {
  if (!item.roles) return true
  return hasRole(role, item.roles)
}

/**
 * Whether `role` may open `pathname`: the page's nav item decides, so hiding
 * a link and blocking its route can't drift apart. Paths outside the nav
 * (404s) are left for the not-found screen.
 */
export function canAccessPath(pathname: string, role: string | undefined) {
  const item = findNavItem(pathname)
  return !item || canSeeNavItem(item, role)
}

/**
 * Where a role starts: the first nav page it can open. That's the dashboard
 * for most staff, the bed and breakfast list for catering and the units page
 * for housekeeping.
 */
export function getHomeNavItem(role: string | undefined) {
  return dashboardNav.find((item) => canSeeNavItem(item, role)) ?? profileNav
}
