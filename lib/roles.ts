export type RoleTone = "crimson" | "flame" | "green" | "violet" | "blue"

const toneByRole: Record<string, RoleTone> = {
  super_admin: "crimson",
  admin: "flame",
  finance: "green",
  housekeeping: "violet",
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
