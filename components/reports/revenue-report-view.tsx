"use client"

import { cn } from "cn"
import {
  ReportError,
  StatCardSkeleton,
} from "@/components/dashboard/report-state"
import {
  ChangeFiltersButton,
  ReportHeader,
} from "@/components/reports/report-header"
import { ReportCsvDownload } from "@/components/reports/report-csv"
import { RevenueReportDialog } from "@/components/reports/revenue-report-dialog"
import {
  ReportPanel,
  ShareBreakdown,
} from "@/components/reports/share-breakdown"
import { StatCard } from "@/components/stat-card"
import { Skeleton } from "@/components/ui/skeleton"
import { useRevenueReport } from "@/hooks/use-revenue-report"
import { getApiErrorMessage } from "@/lib/api/errors"
import { exportRevenueReport, type ReportDateRange } from "@/lib/api/reports"
import { formatCurrency } from "@/lib/format"
import {
  formatCount,
  getBookingPaymentSegments,
  getPaymentMethodSegments,
  getRevenueStatCards,
} from "@/lib/reports"
import type { RevenueReport } from "@/lib/types"

const STAT_CARD_COUNT = 5

const statGridClassName =
  "grid grid-cols-[repeat(auto-fit,minmax(min(13rem,100%),1fr))] gap-4"

function plural(count: number, one: string, many: string) {
  return `${formatCount(count)} ${count === 1 ? one : many}`
}

/**
 * `/reports/revenue`: the period comes from the URL (set by
 * `RevenueReportDialog`), so the report survives a reload and can be
 * shared as a link.
 */
export function RevenueReportView({ range }: { range: ReportDateRange }) {
  const report = useRevenueReport(range)

  return (
    <section className="grid gap-6">
      <ReportHeader
        title="Revenue report"
        from={range.from_date}
        to={range.to_date}
        action={
          <>
            <ReportCsvDownload
              filters={range}
              noun="revenue report"
              exportFile={exportRevenueReport}
            />
            <RevenueReportDialog initialRange={range}>
              <ChangeFiltersButton />
            </RevenueReportDialog>
          </>
        }
      />

      {report.isPending ? (
        <RevenueReportSkeleton />
      ) : report.isError ? (
        <ReportError
          message={getApiErrorMessage(
            report.error,
            "We couldn't generate the revenue report."
          )}
          onRetry={() => report.refetch()}
        />
      ) : (
        <div
          className={cn(
            "grid gap-6 transition-opacity",
            report.isPlaceholderData && "opacity-60"
          )}
        >
          <RevenueReportBody report={report.data} />
        </div>
      )}
    </section>
  )
}

function RevenueReportBody({ report }: { report: RevenueReport }) {
  const { bookings, cancellations, payment_methods: methods } = report

  return (
    <>
      <div className={statGridClassName}>
        {getRevenueStatCards(report.revenue).map((card) => (
          <StatCard
            key={card.key}
            title={card.title}
            titleClassName={card.titleClassName}
            text={card.text}
            label={card.label}
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ShareBreakdown
          title="Payment methods"
          total={methods.total}
          totalLabel={formatCurrency(methods.total)}
          segments={getPaymentMethodSegments(methods)}
          format={formatCurrency}
          emptyMessage="No payments were collected in this period."
        />

        <ShareBreakdown
          title="Bookings by payment"
          total={bookings.total}
          totalLabel={plural(bookings.total, "booking", "bookings")}
          segments={getBookingPaymentSegments(bookings)}
          format={formatCount}
          emptyMessage="No bookings in this period."
        />

        <ReportPanel
          title="Cancellations"
          aside={plural(cancellations.total_cancelled, "booking", "bookings")}
        >
          <dl className="grid gap-2.5 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-foreground">Fees collected</dt>
              <dd className="font-semibold text-foreground tabular-nums">
                {formatCurrency(cancellations.fees_collected)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-foreground">Refunds issued</dt>
              <dd className="font-semibold text-foreground tabular-nums">
                {formatCurrency(cancellations.refunds_issued)}
              </dd>
            </div>
          </dl>
        </ReportPanel>
      </div>
    </>
  )
}

function RevenueReportSkeleton() {
  return (
    <>
      <div className={statGridClassName}>
        {Array.from({ length: STAT_CARD_COUNT }, (_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="grid gap-4 rounded-xl bg-card p-5 shadow-sm ring-1 ring-foreground/10"
          >
            <Skeleton className="h-3 w-28 rounded" />
            <Skeleton className="h-3 w-full rounded-full" />
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-4 w-2/3 rounded" />
          </div>
        ))}
      </div>
    </>
  )
}
