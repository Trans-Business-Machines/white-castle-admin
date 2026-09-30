/** The fixed set of staff roles defined by the backend, highest first. */
export const ROLE_NAMES = [
  "super_admin",
  "admin",
  "receptionist",
  "finance",
  "housekeeping",
  "catering",
] as const

export type RoleName = (typeof ROLE_NAMES)[number]

export function isRoleName(value: string): value is RoleName {
  return (ROLE_NAMES as readonly string[]).includes(value)
}

export type RoleTone =
  "crimson" | "flame" | "green" | "violet" | "amber" | "blue"

const toneByRole: Record<RoleName, RoleTone> = {
  super_admin: "crimson",
  admin: "flame",
  receptionist: "blue",
  finance: "green",
  housekeeping: "violet",
  catering: "amber",
}

export function getRoleTone(role: string): RoleTone {
  const slug = roleSlug(role)
  return isRoleName(slug) ? toneByRole[slug] : "blue"
}

/** Accepts a slug ("super_admin") or a label ("Super Admin") and returns the slug. */
export function roleSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
}

/** The top role: outranks every other, including `admin`. */
export function isSuperAdmin(role: string | undefined) {
  return role ? roleSlug(role) === "super_admin" : false
}

/** Whether `role` (a slug or a label) is one of `allowed`. */
export function hasRole(
  role: string | undefined,
  allowed: readonly RoleName[]
) {
  if (!role) return false
  const slug = roleSlug(role)
  return isRoleName(slug) && allowed.includes(slug)
}

/**
 * Roles allowed into the dashboard, requests and bookings. Catering only get
 * the bed and breakfast list and housekeeping only the units page (plus
 * their profile).
 */
export const OPERATIONS_ROLES: readonly RoleName[] = [
  "super_admin",
  "admin",
  "receptionist",
  "finance",
]

/** Roles allowed into the guests pages (`/guests`); not finance. */
export const GUESTS_ROLES: readonly RoleName[] = [
  "super_admin",
  "admin",
  "receptionist",
]

/** Roles allowed into the units pages (`/units`); housekeeping but not finance. */
export const UNITS_ROLES: readonly RoleName[] = [
  "super_admin",
  "admin",
  "receptionist",
  "housekeeping",
]

/**
 * Roles allowed to add, edit and delete rooms. Receptionists and
 * housekeeping can only view them and set their status (`UNIT_STATUS_ROLES`).
 */
export const UNIT_MANAGE_ROLES: readonly RoleName[] = ["super_admin", "admin"]

/** Roles allowed into the user management module (`/users`). */
export const USER_MANAGEMENT_ROLES: readonly RoleName[] = [
  "super_admin",
  "admin",
]

/** Roles allowed into the motel settings page (`/settings`). */
export const SETTINGS_ROLES: readonly RoleName[] = ["super_admin"]

/** Roles allowed into the audit logs (`/audits` and each log under it). */
export const AUDIT_ROLES: readonly RoleName[] = ["super_admin"]

/** Roles allowed into the reports page (`/reports` and each report under it). */
export const REPORTS_ROLES: readonly RoleName[] = ["super_admin", "admin"]

/** Roles allowed into the payments page (`/payments`). */
export const PAYMENTS_ROLES: readonly RoleName[] = [
  "super_admin",
  "admin",
  "receptionist",
  "finance",
]

/** Roles allowed into the catering page (`/catering`, the bed and breakfast list). */
export const CATERING_ROLES: readonly RoleName[] = [
  "super_admin",
  "admin",
  "catering",
]

/** Roles allowed to verify or reject a payment. */
export const PAYMENT_REVIEW_ROLES: readonly RoleName[] = [
  "super_admin",
  "admin",
  "finance",
]

/** Roles allowed to delete a guest record. */
export const GUEST_DELETE_ROLES: readonly RoleName[] = ["super_admin", "admin"]

/**
 * Roles allowed to act on a booking (approve / reject, check in / out,
 * extend, extra person, cancel). Finance can only view bookings.
 */
export const BOOKING_ACTION_ROLES: readonly RoleName[] = [
  "super_admin",
  "admin",
  "receptionist",
]

/** Roles shown the month-to-date stat cards on `/bookings`; not receptionist. */
export const BOOKING_STATS_ROLES: readonly RoleName[] = [
  "super_admin",
  "admin",
  "finance",
]

/** Roles shown this month's payment stat cards on `/payments`; not receptionist. */
export const PAYMENT_STATS_ROLES: readonly RoleName[] = [
  "super_admin",
  "admin",
  "finance",
]

/** Roles allowed to export payments as CSV from `/payments`; not receptionist. */
export const PAYMENT_EXPORT_ROLES: readonly RoleName[] = [
  "super_admin",
  "admin",
  "finance",
]

/** Roles allowed to create a booking; not finance. */
export const BOOKING_CREATE_ROLES: readonly RoleName[] = [
  "super_admin",
  "admin",
  "receptionist",
]

/** Roles allowed to delete a booking. */
export const BOOKING_DELETE_ROLES: readonly RoleName[] = ["super_admin"]

/** Roles shown the occupancy stat cards on the units page. */
export const UNIT_STATS_ROLES: readonly RoleName[] = [
  "super_admin",
  "admin",
  "receptionist",
]

/** Roles allowed to set a room's status (available / housekeeping / maintenance). */
export const UNIT_STATUS_ROLES: readonly RoleName[] = [
  "super_admin",
  "admin",
  "receptionist",
  "housekeeping",
]

interface RoleToneClasses {
  /** Tinted pill: background + text. */
  badge: string
  /** Initials avatar: background + text. */
  avatar: string
  /** Solid text colour, e.g. stat-card title. */
  text: string
  /** Solid fill, e.g. a small dot or bar. */
  dot: string
}

export const roleToneClasses: Record<RoleTone, RoleToneClasses> = {
  crimson: {
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    avatar: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    text: "text-rose-700 dark:text-rose-300",
    dot: "bg-rose-600",
  },
  flame: {
    badge:
      "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
    avatar:
      "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
    text: "text-orange-700 dark:text-orange-300",
    dot: "bg-orange-500",
  },
  green: {
    badge:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    avatar:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-600",
  },
  violet: {
    badge:
      "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
    avatar:
      "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
    text: "text-violet-700 dark:text-violet-300",
    dot: "bg-violet-600",
  },
  amber: {
    badge:
      "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
    avatar:
      "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
    text: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  blue: {
    badge: "bg-brand-azure/10 text-brand-azure dark:text-sky-300",
    avatar: "bg-brand-azure/10 text-brand-azure dark:text-sky-300",
    text: "text-brand-azure dark:text-sky-300",
    dot: "bg-brand-azure",
  },
}

export function getRoleClasses(role: string) {
  return roleToneClasses[getRoleTone(role)]
}
