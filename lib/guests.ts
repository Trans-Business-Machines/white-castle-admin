import { getIdDocumentLabel, getIdNumberLabel } from "@/lib/schemas/guests"
import type { Guest, GuestsStats } from "@/lib/types"

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

/**
 * The ID details a guest still needs before they can check in, labelled for
 * their ID type (e.g. `["ID number", "National ID image"]`). Empty when both
 * the number and at least one uploaded scan are on record.
 */
export function getMissingIdDetails(
  guest: Pick<Guest, "id_type" | "national_id" | "id_documents">
) {
  const missing: string[] = []
  if (!guest.national_id?.trim()) missing.push(getIdNumberLabel(guest.id_type))
  if (!guest.id_documents?.length) {
    missing.push(getIdDocumentLabel(guest.id_type))
  }
  return missing
}
