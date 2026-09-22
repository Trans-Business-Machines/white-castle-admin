import {
  Bed,
  Calendars,
  ChartColumnBig,
  NotebookPen,
  UserCog,
  Users,
  Banknote,
  type LucideIcon,
} from "lucide-react"
import { USER_MANAGEMENT_ROLES, roleSlug } from "@/lib/roles"

export interface NavItem {
  title: string
  description: string
  href: string
  icon: LucideIcon
  roles?: readonly string[]
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

export function findNavItem(pathname: string) {
  return [...dashboardNav, profileNav].find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  )
}

/** Whether a nav item should be shown to a user with the given role. */
export function canSeeNavItem(item: NavItem, role: string | undefined) {
  if (!item.roles) return true
  return role !== undefined && item.roles.includes(roleSlug(role))
}
