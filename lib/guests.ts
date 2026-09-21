import type { GuestsStats } from "@/lib/types"

/** Text colour for each guest stat's title. */
const STAT_TITLE_CLASSES: Record<keyof GuestsStats, string> = {
  total_guests: "text-brand-navy dark:text-sky-200",
  active: "text-emerald-700 dark:text-emerald-300",
  blacklisted: "text-rose-700 dark:text-rose-300",
}

/**
 * Cards rendered for `GET /guests/stats`, in display order. Keys mirror
 * `GuestsStats` so a new field in the API shape fails the typecheck here
 * until it gets a card.
 */
export const GUEST_STAT_CARDS: ReadonlyArray<{
  key: keyof GuestsStats
  title: string
  label: string
  titleClassName: string
}> = [
  {
    key: "total_guests",
    title: "Total guests",
    label: "on record",
    titleClassName: STAT_TITLE_CLASSES.total_guests,
  },
  {
    key: "active",
    title: "Active",
    label: "free to book",
    titleClassName: STAT_TITLE_CLASSES.active,
  },
  {
    key: "blacklisted",
    title: "Blacklisted",
    label: "blocked from booking",
    titleClassName: STAT_TITLE_CLASSES.blacklisted,
  },
]
