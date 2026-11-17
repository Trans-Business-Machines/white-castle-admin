/** Role slugs are dynamic: built-in roles plus any custom roles an admin creates. */
export type RoleName = string

export type RoleTone =
  "crimson" | "flame" | "green" | "violet" | "amber" | "blue"

/** Known roles get a stable colour; custom roles fall back to blue. */
const toneByRole: Record<string, RoleTone> = {
  super_admin: "crimson",
  admin: "flame",
  receptionist: "blue",
  finance: "green",
  housekeeping: "violet",
  catering: "amber",
}

export function getRoleTone(role: string): RoleTone {
  return toneByRole[roleSlug(role)] ?? "blue"
}

/** Accepts a slug ("super_admin") or a label ("Super Admin") and returns the slug. */
export function roleSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
}

/** The top role: used only to protect super-admin accounts from lower staff. */
export function isSuperAdmin(role: string | undefined) {
  return role ? roleSlug(role) === "super_admin" : false
}

/** Whether an account holds the super-admin role, whatever its primary role is. */
export function holdsSuperAdmin(user: {
  role?: string
  roles?: readonly string[]
}) {
  return (
    isSuperAdmin(user.role) ||
    (user.roles ?? []).some((role) => isSuperAdmin(role))
  )
}

/**
 * Permission checks mirror the backend: a `system:full` grant opens
 * everything, and a module wildcard (`bookings:*`) covers its child actions.
 */
export function hasPermission(
  permissions: readonly string[] | undefined | null,
  required: string
) {
  if (!permissions?.length) return false
  if (permissions.includes("system:full") || permissions.includes("*")) {
    return true
  }
  if (permissions.includes(required)) return true
  const moduleName = required.split(":", 1)[0]
  return permissions.includes(`${moduleName}:*`)
}

/** True when the user holds at least one of the listed permissions. */
export function hasAnyPermission(
  permissions: readonly string[] | undefined | null,
  required: readonly string[]
) {
  return required.some((slug) => hasPermission(permissions, slug))
}

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
