import type { ComponentProps, ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatReportPeriod } from "@/lib/reports"

interface ReportHeaderProps {
  title: string
  /** The report's period, "yyyy-MM-dd" or "" for open-ended. */
  from: string
  to: string
  /**
   * Labels of the filters in use besides the dates, e.g. "Status: Pending".
   * Omit for reports that only take a date range.
   */
  chips?: string[]
  /** Right-hand actions, e.g. Download CSV and the "Change filters" dialog. */
  action: ReactNode
}

/** Back link, report title, period + filter chips, and a filters action. */
export function ReportHeader({
  title,
  from,
  to,
  chips,
  action,
}: ReportHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <Link
          href="/reports"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          All reports
        </Link>
        <h2 className="mt-2 font-heading text-2xl font-bold text-brand-navy dark:text-foreground">
          {title}
        </h2>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium text-foreground">
            {formatReportPeriod(from, to)}
          </span>
          {chips?.length === 0 ? (
            <span className="text-muted-foreground">· No other filters</span>
          ) : (
            chips?.map((chip) => (
              <span
                key={chip}
                className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
              >
                {chip}
              </span>
            ))
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">{action}</div>
    </header>
  )
}

/** Trigger for a report page's parameters dialog. */
export function ChangeFiltersButton(props: ComponentProps<typeof Button>) {
  return (
    <Button variant="outline" className="h-11 rounded-md px-5" {...props}>
      <SlidersHorizontal aria-hidden="true" />
      Change filters
    </Button>
  )
}
