import {
  Bed,
  Calendars,
  ChartColumnBig,
  Files,
  NotebookPen,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  title: string
  description: string
  href: string
  icon: LucideIcon
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
    title: "Reports",
    description: "Revenue and occupancy over time",
    href: "/reports",
    icon: Files,
  },
  {
    title: "User Management",
    description: "Staff accounts and permissions",
    href: "/users",
    icon: UserCog,
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
