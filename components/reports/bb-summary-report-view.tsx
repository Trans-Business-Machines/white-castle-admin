"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { cn } from "cn"
import { getBookingHref } from "@/components/bookings/booking-actions-menu"
import { BookingStatusBadge } from "@/components/bookings/booking-status-badge"
import {
  ReportError,
  StatCardSkeleton,
} from "@/components/dashboard/report-state"
import { BbSummaryReportDialog } from "@/components/reports/bb-summary-report-dialog"
import {
  ChangeFiltersButton,
  ReportHeader,
} from "@/components/reports/report-header"
import {
  ReportPanel,
  ShareBreakdown,
} from "@/components/reports/share-breakdown"
import { StatCard } from "@/components/stat-card"
import { TablePagination } from "@/components/table-pagination"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  TableError,
  TableMessageRow,
  TableSkeletonRows,
  tableHeadClassName,
} from "@/components/users/table-state"
import { SearchInput } from "@/components/users/table-toolbar"
import { useBbSummaryReport } from "@/hooks/use-bb-summary-report"
import { usePagination } from "@/hooks/use-pagination"
import { getApiErrorMessage } from "@/lib/api/errors"
import type { BbSummaryReportFilters } from "@/lib/api/reports"
import { formatPartySize, matchesBbSearch } from "@/lib/catering"
import { formatCurrency, formatDate } from "@/lib/format"
import {
  formatBookingCount,
  formatCount,
  getBbSummaryStatCards,
  getMealPlanSegments,
  matchesBookingsReportSearch,
} from "@/lib/reports"
import type {
  BbList,
  BbSummaryReport,
  BookingsReportBooking,
} from "@/lib/types"
import { getRoomTypeLabel } from "@/lib/units"

const STAT_CARD_COUNT = 4
const BOOKING_COLUMNS = 6
const BREAKFAST_COLUMNS = 5

const statGridClassName =
  "grid grid-cols-[repeat(auto-fit,minmax(min(13rem,100%),1fr))] gap-4"

const surfaceClassName =
  "overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/10"

/**
 * `/reports/bed-and-breakfast`: the period and breakfast list day come from
 * the URL (set by `BbSummaryReportDialog`), so the report survives a reload
 * and can be shared as a link.
 */
export function BbSummaryReportView({
  filters,
}: {
  filters: BbSummaryReportFilters
}) {
  const report = useBbSummaryReport(filters)

  return (
    <section className="grid gap-6">
      <ReportHeader
        title="Breakfast List Report"
        from={filters.from_date}
        to={filters.to_date}
        chips={
          filters.target_date
            ? [`Breakfast list: ${formatDate(filters.target_date)}`]
            : undefined
        }
        action={
          <BbSummaryReportDialog initialFilters={filters}>
            <ChangeFiltersButton />
          </BbSummaryReportDialog>
        }
      />

      {report.isPending ? (
        <BbSummarySkeleton />
      ) : report.isError ? (
        <ReportError
          message={getApiErrorMessage(
            report.error,
            "We couldn't generate the breakfast list report."
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
          <BbSummary report={report.data} />
        </div>
      )}

      <BbTables filters={filters} />
    </section>
  )
}

function BbSummary({ report }: { report: BbSummaryReport }) {
  const segments = getMealPlanSegments(report.summary)
  const mealPlanTotal =
    segments?.reduce((sum, segment) => sum + segment.value, 0) ?? 0
  const list = report.today_breakfast_list

  return (
    <>
      <div className={statGridClassName}>
        {getBbSummaryStatCards(report.summary).map((card) => (
          <StatCard
            key={card.key}
            title={card.title}
            titleClassName={card.titleClassName}
            text={card.text}
            label={card.label}
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {segments ? (
          <ShareBreakdown
            title="Meal plan"
            total={mealPlanTotal}
            totalLabel={formatBookingCount(mealPlanTotal)}
            segments={segments}
            format={formatCount}
            emptyMessage="No bookings in this period."
          />
        ) : (
          <ReportPanel title="Meal plan">
            <p className="text-sm text-muted-foreground">
              Breakfast plans to Bed Only:{" "}
              <span className="font-semibold text-foreground">
                {report.summary.meal_vs_room_only_ratio || "—"}
              </span>
            </p>
          </ReportPanel>
        )}

        <ReportPanel
          title={`Breakfast on ${formatDate(list.date)}`}
          aside={formatBookingCount(list.bookings.length)}
        >
          <dl className="grid grid-cols-3 gap-4">
            <BreakfastFigure label="Guests" value={list.total_guests} />
            <BreakfastFigure label="Adults" value={list.total_adults} />
            <BreakfastFigure label="Children" value={list.total_children} />
          </dl>
        </ReportPanel>
      </div>
    </>
  )
}

function BreakfastFigure({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="font-heading text-2xl font-bold text-foreground tabular-nums">
        {formatCount(value)}
      </dd>
    </div>
  )
}

function BbSummarySkeleton() {
  return (
    <>
      <div className={statGridClassName}>
        {Array.from({ length: STAT_CARD_COUNT }, (_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => (
          <div
            key={index}
            className="grid gap-4 rounded-xl bg-card p-5 shadow-sm ring-1 ring-foreground/10"
          >
            <Skeleton className="h-3 w-28 rounded" />
            <Skeleton className="h-3 w-full rounded-full" />
            <Skeleton className="h-4 w-3/4 rounded" />
          </div>
        ))}
      </div>
    </>
  )
}

type BbTab = "bookings" | "breakfast"

/** B&B bookings in the period, and the breakfast list for the chosen day. */
function BbTables({ filters }: { filters: BbSummaryReportFilters }) {
  const report = useBbSummaryReport(filters)
  const [tab, setTab] = useState<BbTab>("bookings")
  const filtersKey = JSON.stringify(filters)

  if (report.isPending || report.isError) {
    return (
      <div className={surfaceClassName}>
        <Table>
          <BookingsHeader />
          <TableBody>
            {report.isPending ? (
              <TableSkeletonRows columns={BOOKING_COLUMNS} />
            ) : (
              <TableMessageRow columns={BOOKING_COLUMNS}>
                <TableError
                  message="We couldn't load the bookings in this report."
                  onRetry={() => report.refetch()}
                />
              </TableMessageRow>
            )}
          </TableBody>
        </Table>
      </div>
    )
  }

  const list = report.data.today_breakfast_list

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => setTab(value as BbTab)}
      className="gap-3"
    >
      <TabsList className="max-w-full overflow-x-auto">
        <TabsTrigger value="bookings" className="px-3">
          Breakfast bookings
          <TabCount count={report.data.meal_plan_bookings.length} />
        </TabsTrigger>
        <TabsTrigger value="breakfast" className="px-3">
          Breakfast list · {formatDate(list.date, "d MMM")}
          <TabCount count={list.bookings.length} />
        </TabsTrigger>
      </TabsList>

      <TabsContent value="bookings">
        <BbBookingsTable
          bookings={report.data.meal_plan_bookings}
          dimmed={report.isPlaceholderData}
          filtersKey={filtersKey}
        />
      </TabsContent>
      <TabsContent value="breakfast">
        <BreakfastListTable
          list={list}
          dimmed={report.isPlaceholderData}
          filtersKey={filtersKey}
        />
      </TabsContent>
    </Tabs>
  )
}

function TabCount({ count }: { count: number }) {
  return (
    <span className="rounded-full bg-muted px-1.5 text-xs font-semibold text-muted-foreground tabular-nums">
      {formatCount(count)}
    </span>
  )
}

/**
 * Search + paging over a list that arrives with the report. New filters
 * (a prop from the URL) send it back to page 1 during render.
 */
function useReportList<T>(
  items: readonly T[],
  matches: (item: T, search: string) => boolean,
  filtersKey: string
) {
  const [search, setSearch] = useState("")
  const rows = useMemo(
    () => items.filter((item) => matches(item, search)),
    [items, matches, search]
  )
  const pagination = usePagination(rows)
  const { setPage } = pagination

  const [pagedFilters, setPagedFilters] = useState(filtersKey)
  if (pagedFilters !== filtersKey) {
    setPagedFilters(filtersKey)
    setPage(1)
  }

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  return { search, handleSearchChange, pagination }
}

function BookingsHeader() {
  return (
    <TableHeader>
      <TableRow className="hover:bg-transparent">
        <TableHead className={tableHeadClassName}>Booking Ref</TableHead>
        <TableHead className={tableHeadClassName}>Guest</TableHead>
        <TableHead className={tableHeadClassName}>Stay</TableHead>
        <TableHead className={tableHeadClassName}>Party</TableHead>
        <TableHead className={tableHeadClassName}>Status</TableHead>
        <TableHead className={cn(tableHeadClassName, "text-right")}>
          Meal plan total
        </TableHead>
      </TableRow>
    </TableHeader>
  )
}

function BbBookingsTable({
  bookings,
  dimmed,
  filtersKey,
}: {
  bookings: BookingsReportBooking[]
  dimmed: boolean
  filtersKey: string
}) {
  const { search, handleSearchChange, pagination } = useReportList(
    bookings,
    matchesBookingsReportSearch,
    filtersKey
  )

  return (
    <div className={surfaceClassName}>
      <div className="flex max-w-xl flex-wrap items-center gap-3 p-4">
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          placeholder="Search reference, guest or email"
          label="Search breakfast bookings"
        />
      </div>

      <Table className={cn("mt-4 transition-opacity", dimmed && "opacity-60")}>
        <BookingsHeader />
        <TableBody>
          {pagination.total === 0 ? (
            <TableMessageRow columns={BOOKING_COLUMNS}>
              {search.trim()
                ? `No bookings match "${search.trim()}".`
                : "No breakfast bookings in this period."}
            </TableMessageRow>
          ) : (
            pagination.pageItems.map((booking) => (
              <TableRow key={booking.booking_id} className="h-14">
                <TableCell className="px-4">
                  <Link
                    href={getBookingHref(booking.booking_id)}
                    className="font-mono text-sm font-semibold text-foreground underline-offset-4 hover:text-brand-azure hover:underline"
                  >
                    {booking.reference}
                  </Link>
                </TableCell>
                <TableCell className="px-4">
                  <div className="grid">
                    <span className="font-semibold text-foreground">
                      {booking.guest_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {booking.guest_email || "—"}
                    </span>
                  </div>
                </TableCell>
                <StayCell
                  checkIn={booking.check_in_date}
                  checkOut={booking.check_out_date}
                  nights={booking.nights}
                />
                <TableCell className="px-4">
                  {formatPartySize(booking.adults, booking.children)}
                </TableCell>
                <TableCell className="px-4">
                  <BookingStatusBadge status={booking.status} />
                </TableCell>
                <TableCell className="px-4 text-right font-mono tabular-nums">
                  {formatCurrency(booking.bb_total ?? 0)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <TablePagination
        page={pagination.page}
        pageCount={pagination.pageCount}
        pageSize={pagination.pageSize}
        total={pagination.total}
        onPageChange={pagination.setPage}
        itemLabel="bookings"
      />
    </div>
  )
}

function BreakfastListTable({
  list,
  dimmed,
  filtersKey,
}: {
  list: BbList
  dimmed: boolean
  filtersKey: string
}) {
  const { search, handleSearchChange, pagination } = useReportList(
    list.bookings,
    matchesBbSearch,
    filtersKey
  )

  return (
    <div className={surfaceClassName}>
      <div className="flex max-w-xl flex-wrap items-center gap-3 p-4">
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          placeholder="Search guest, reference or room"
          label="Search the breakfast list"
        />
      </div>

      <Table className={cn("mt-4 transition-opacity", dimmed && "opacity-60")}>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={tableHeadClassName}>Guest</TableHead>
            <TableHead className={tableHeadClassName}>Booking Ref</TableHead>
            <TableHead className={tableHeadClassName}>Room</TableHead>
            <TableHead className={tableHeadClassName}>Party</TableHead>
            <TableHead className={tableHeadClassName}>
              Special requests
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagination.total === 0 ? (
            <TableMessageRow columns={BREAKFAST_COLUMNS}>
              {search.trim()
                ? `No guests on this list match "${search.trim()}".`
                : `No guests are booked for breakfast on ${formatDate(list.date)}.`}
            </TableMessageRow>
          ) : (
            pagination.pageItems.map((booking) => (
              <TableRow key={booking.booking_id} className="h-14">
                <TableCell className="px-4">
                  <div className="grid">
                    <span className="font-semibold text-foreground">
                      {booking.guest_name}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {booking.guest_phone || "—"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="px-4">
                  <Link
                    href={getBookingHref(booking.booking_id)}
                    className="font-mono text-sm font-semibold text-foreground underline-offset-4 hover:text-brand-azure hover:underline"
                  >
                    {booking.reference}
                  </Link>
                </TableCell>
                <TableCell className="px-4">
                  <div className="grid">
                    <span className="font-semibold text-foreground">
                      {booking.room_number}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {getRoomTypeLabel(booking.room_type)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="px-4">
                  {formatPartySize(booking.adults, booking.children)}
                </TableCell>
                <TableCell className="max-w-64 px-4 whitespace-normal">
                  {booking.special_requests || (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <TablePagination
        page={pagination.page}
        pageCount={pagination.pageCount}
        pageSize={pagination.pageSize}
        total={pagination.total}
        onPageChange={pagination.setPage}
        itemLabel="guests"
      />
    </div>
  )
}

function StayCell({
  checkIn,
  checkOut,
  nights,
}: {
  checkIn: string
  checkOut: string
  nights: number
}) {
  return (
    <TableCell className="px-4">
      <div className="grid">
        <span className="text-foreground">
          {formatDate(checkIn, "d MMM")} – {formatDate(checkOut, "d MMM yyyy")}
        </span>
        <span className="text-xs text-muted-foreground">
          {nights} {nights === 1 ? "night" : "nights"}
        </span>
      </div>
    </TableCell>
  )
}
