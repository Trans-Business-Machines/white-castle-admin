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
  type LucideIcon,
} from "lucide-react"
import {
  CATERING_ROLES,
  PAYMENTS_ROLES,
  REPORTS_ROLES,
  SETTINGS_ROLES,
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
  },
  {
    title: "Requests",
    description: "Booking requests waiting for approval",
    href: "/requests",
    icon: NotebookPen,
  },
  {
    title: "Bookings",
    description: "Confirmed stays, arrivals and departures",
    href: "/bookings",
    icon: Calendars,
  },
  {
    title: "Guest Management",
    description: "Everyone who has stayed at the property",
    href: "/guests",
    icon: Users,
  },
  {
    title: "Units",
    description: "Rooms, rates and availability",
    href: "/units",
    icon: Bed,
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
    description: "Guests on the bed and breakfast list",
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
