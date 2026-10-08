import type { ComponentProps, ComponentType, ReactNode } from "react"
import { cn } from "cn"
import { FileChartColumn } from "lucide-react"
import { BbSummaryReportDialog } from "@/components/reports/bb-summary-report-dialog"
import {
  BookingsReportDialog,
  BookingsReportExportDialog,
} from "@/components/reports/bookings-report-dialog"
import {
  CancellationsReportDialog,
  CancellationsReportExportDialog,
} from "@/components/reports/cancellations-report-dialog"
import {
  GuestsReportDialog,
  GuestsReportExportDialog,
} from "@/components/reports/guests-report-dialog"
import {
  PaymentsReportDialog,
  PaymentsReportExportDialog,
} from "@/components/reports/payments-report-dialog"
import {
  RevenueReportDialog,
  RevenueReportExportDialog,
} from "@/components/reports/revenue-report-dialog"
import { Button } from "@/components/ui/button"
import { REPORT_TYPES, type ReportSlug, type ReportType } from "@/lib/reports"

/**
 * The parameters dialog behind each card's CTA; it wraps the button as its
 * trigger. Keyed by every `ReportSlug`, so a new report can't ship without one.
 */
const REPORT_DIALOGS: Record<
  ReportSlug,
  ComponentType<{ children: ReactNode }>
> = {
  bookings: BookingsReportDialog,
  "bed-and-breakfast": BbSummaryReportDialog,
  revenue: RevenueReportDialog,
  payments: PaymentsReportDialog,
  guests: GuestsReportDialog,
  cancellations: CancellationsReportDialog,
}

/**
 * The Download CSV CTA beside Generate report (a dialog over the same
 * filters). Partial while the breakfast list has no export yet.
 */
const REPORT_EXPORT_DIALOGS: Partial<Record<ReportSlug, ComponentType>> = {
  bookings: BookingsReportExportDialog,
  revenue: RevenueReportExportDialog,
  payments: PaymentsReportExportDialog,
  guests: GuestsReportExportDialog,
  cancellations: CancellationsReportExportDialog,
}

/** Same surface as the settings sections. */
const cardClassName =
  "flex flex-col rounded-xl bg-card p-5 shadow-sm ring-1 ring-foreground/10"

/** One card per report type (`REPORT_TYPES`), each with its own CTA. */
export function ReportCards() {
  return (
    <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {REPORT_TYPES.map((report) => (
        <li key={report.slug} className="flex">
          <ReportCard report={report} />
        </li>
      ))}
    </ul>
  )
}

function ReportCard({ report }: { report: ReportType }) {
  const Icon = report.icon
  const Dialog = REPORT_DIALOGS[report.slug]
  const ExportDialog = REPORT_EXPORT_DIALOGS[report.slug]
  const headingId = `report-${report.slug}`

  return (
    <article
      aria-labelledby={headingId}
      className={cn(cardClassName, "w-full")}
    >
      <span
        aria-hidden="true"
        className="flex size-11 items-center justify-center rounded-lg bg-brand-azure/10 text-brand-navy dark:bg-muted dark:text-foreground"
      >
        <Icon className="size-5" />
      </span>

      <h2
        id={headingId}
        className="mt-4 font-heading text-lg font-bold text-brand-navy dark:text-foreground"
      >
        {report.title}
      </h2>
      <p className="mt-1.5 flex-1 text-sm text-pretty text-muted-foreground">
        {report.description}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <Dialog>
          <GenerateButton />
        </Dialog>
        {ExportDialog ? <ExportDialog /> : null}
      </div>
    </article>
  )
}

function GenerateButton(props: ComponentProps<typeof Button>) {
  return (
    <Button
      type="button"
      className="h-10 rounded-md bg-brand-azure px-4 text-white hover:bg-brand-azure/90 focus-visible:ring-brand-azure/30"
      {...props}
    >
      <FileChartColumn aria-hidden="true" />
      Generate report
    </Button>
  )
}
