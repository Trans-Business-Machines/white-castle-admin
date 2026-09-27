import type { DashboardReport } from "@/lib/types"

export type TodayStatKey = keyof DashboardReport["today"]

/** Today's front-desk cards, in display order. */
export const TODAY_STAT_CARDS: ReadonlyArray<{
  key: TodayStatKey
  title: string
  titleClassName: string
  label: string
}> = [
  {
    key: "arrivals",
    title: "Arrivals",
    titleClassName: "text-brand-azure dark:text-sky-300",
    label: "Checking in today",
  },
  {
    key: "departures",
    title: "Departures",
    titleClassName: "text-brand-navy dark:text-sky-200",
    label: "Checking out today",
  },
  {
    key: "pending_approvals",
    title: "Pending approvals",
    titleClassName: "text-amber-700 dark:text-amber-300",
    label: "Bookings awaiting approval",
  },
  {
    key: "pending_payments",
    title: "Pending payments",
    titleClassName: "text-rose-700 dark:text-rose-300",
    label: "Bookings awaiting payment",
  },
]

export type OverviewPeriodKey = "this_week" | "this_month"

/** Week and month overview cards, in display order. */
export const OVERVIEW_PERIODS: ReadonlyArray<{
  key: OverviewPeriodKey
  title: string
}> = [
  { key: "this_week", title: "This week" },
  { key: "this_month", title: "This month" },
]
