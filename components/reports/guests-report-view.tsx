"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { cn } from "cn"
import {
  ReportError,
  StatCardSkeleton,
} from "@/components/dashboard/report-state"
import { getGuestHref } from "@/components/guests/guest-actions-menu"
import { GuestBlacklistBadge } from "@/components/guests/guest-blacklist-badge"
import { GuestsReportDialog } from "@/components/reports/guests-report-dialog"
import {
  ChangeFiltersButton,
  ReportHeader,
} from "@/components/reports/report-header"
import { StatCard } from "@/components/stat-card"
import { TablePagination } from "@/components/table-pagination"
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
import { useGuestsReport } from "@/hooks/use-guests-report"
import { usePagination } from "@/hooks/use-pagination"
import { getApiErrorMessage } from "@/lib/api/errors"
import type { ReportDateRange } from "@/lib/api/reports"
import { formatCurrency, formatDate, getInitials } from "@/lib/format"
import {
  GUESTS_REPORT_LISTS,
  formatCount,
  getGuestsReportStatCards,
  matchesGuestSearch,
  type GuestsReportListKey,
} from "@/lib/reports"
import type { Guest } from "@/lib/types"

const COLUMNS = 6
const STAT_CARD_COUNT = 5

const statGridClassName =
  "grid grid-cols-[repeat(auto-fit,minmax(min(13rem,100%),1fr))] gap-4"

const surfaceClassName =
  "overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/10"

/**
 * `/reports/guests`: the period comes from the URL (set by
 * `GuestsReportDialog`), so the report survives a reload and can be shared
 * as a link.
 */
export function GuestsReportView({ range }: { range: ReportDateRange }) {
  const report = useGuestsReport(range)

  return (
    <section className="grid gap-6">
      <ReportHeader
        title="Guests report"
        from={range.from_date}
        to={range.to_date}
        action={
          <GuestsReportDialog initialRange={range}>
            <ChangeFiltersButton />
          </GuestsReportDialog>
        }
      />

      {report.isPending ? (
        <div className={statGridClassName}>
          {Array.from({ length: STAT_CARD_COUNT }, (_, index) => (
            <StatCardSkeleton key={index} />
          ))}
        </div>
      ) : report.isError ? (
        <ReportError
          message={getApiErrorMessage(
            report.error,
            "We couldn't generate the guests report."
          )}
          onRetry={() => report.refetch()}
        />
      ) : (
        <div
          className={cn(
            statGridClassName,
            "transition-opacity",
            report.isPlaceholderData && "opacity-60"
          )}
        >
          {getGuestsReportStatCards(report.data.summary).map((card) => (
            <StatCard
              key={card.key}
              title={card.title}
              titleClassName={card.titleClassName}
              text={card.text}
              label={card.label}
            />
          ))}
        </div>
      )}

      <GuestLists range={range} />
    </section>
  )
}

/** One tab per list in the report (new, top returning, blacklisted). */
function GuestLists({ range }: { range: ReportDateRange }) {
  const report = useGuestsReport(range)
  const [list, setList] = useState<GuestsReportListKey>("new_guests")

  if (report.isPending || report.isError) {
    return (
      <div className={surfaceClassName}>
        <Table>
          <GuestTableHeader blacklist={false} />
          <TableBody>
            {report.isPending ? (
              <TableSkeletonRows columns={COLUMNS} />
            ) : (
              <TableMessageRow columns={COLUMNS}>
                <TableError
                  message="We couldn't load the guests in this report."
                  onRetry={() => report.refetch()}
                />
              </TableMessageRow>
            )}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <Tabs
      value={list}
      onValueChange={(value) => setList(value as GuestsReportListKey)}
      className="gap-3"
    >
      <TabsList className="max-w-full overflow-x-auto">
        {GUESTS_REPORT_LISTS.map((tab) => (
          <TabsTrigger key={tab.key} value={tab.key} className="px-3">
            {tab.label}
            <span className="rounded-full bg-muted px-1.5 text-xs font-semibold text-muted-foreground tabular-nums">
              {formatCount(report.data[tab.key].length)}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>

      {GUESTS_REPORT_LISTS.map((tab) => (
        <TabsContent key={tab.key} value={tab.key}>
          <GuestListTable
            guests={report.data[tab.key]}
            emptyMessage={tab.emptyMessage}
            blacklist={tab.key === "blacklisted_guests"}
            dimmed={report.isPlaceholderData}
            periodKey={JSON.stringify(range)}
          />
        </TabsContent>
      ))}
    </Tabs>
  )
}

function GuestTableHeader({ blacklist }: { blacklist: boolean }) {
  return (
    <TableHeader>
      <TableRow className="hover:bg-transparent">
        <TableHead className={tableHeadClassName}>Guest</TableHead>
        <TableHead className={tableHeadClassName}>Phone</TableHead>
        <TableHead className={tableHeadClassName}>Nationality</TableHead>
        <TableHead className={cn(tableHeadClassName, "text-right")}>
          Stays
        </TableHead>
        <TableHead className={cn(tableHeadClassName, "text-right")}>
          Spent
        </TableHead>
        <TableHead className={tableHeadClassName}>
          {blacklist ? "Reason" : "Added"}
        </TableHead>
      </TableRow>
    </TableHeader>
  )
}

interface GuestListTableProps {
  guests: Guest[]
  emptyMessage: string
  /** The blacklist tab swaps the "Added" column for the reason. */
  blacklist: boolean
  /** True while a new period loads over the old one. */
  dimmed: boolean
  /** Changes with the period, sending the table back to page 1. */
  periodKey: string
}

function GuestListTable({
  guests,
  emptyMessage,
  blacklist,
  dimmed,
  periodKey,
}: GuestListTableProps) {
  const [search, setSearch] = useState("")
  const rows = useMemo(
    () => guests.filter((guest) => matchesGuestSearch(guest, search)),
    [guests, search]
  )
  const pagination = usePagination(rows)
  const { setPage } = pagination

  // A new period starts back on page 1 (it arrives as a prop from the URL,
  // so this is the render-time equivalent of a change handler).
  const [pagedPeriod, setPagedPeriod] = useState(periodKey)
  if (pagedPeriod !== periodKey) {
    setPagedPeriod(periodKey)
    setPage(1)
  }

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  return (
    <div className={surfaceClassName}>
      <div className="flex max-w-xl flex-wrap items-center gap-3 p-4">
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          placeholder="Search name, phone or email"
          label="Search this list"
        />
      </div>

      <Table className={cn("mt-4 transition-opacity", dimmed && "opacity-60")}>
        <GuestTableHeader blacklist={blacklist} />
        <TableBody>
          {pagination.total === 0 ? (
            <TableMessageRow columns={COLUMNS}>
              {search.trim()
                ? `No guests in this list match "${search.trim()}".`
                : emptyMessage}
            </TableMessageRow>
          ) : (
            pagination.pageItems.map((guest) => (
              <TableRow key={guest.guest_id} className="h-14">
                <TableCell className="px-4">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                        guest.blacklisted
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300"
                          : "bg-brand-azure/15 text-brand-navy dark:bg-brand-azure/20 dark:text-sky-200"
                      )}
                    >
                      {getInitials(guest.full_name)}
                    </span>
                    <div className="grid min-w-0">
                      <Link
                        href={getGuestHref(guest.guest_id)}
                        className="truncate font-semibold text-foreground underline-offset-4 hover:text-brand-azure hover:underline"
                      >
                        {guest.full_name}
                      </Link>
                      <span className="truncate text-xs text-muted-foreground">
                        {guest.email || "—"}
                      </span>
                      {guest.blacklisted && !blacklist ? (
                        <GuestBlacklistBadge className="mt-0.5 justify-self-start" />
                      ) : null}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-4 font-mono text-sm">
                  {guest.phone || "—"}
                </TableCell>
                <TableCell className="px-4">
                  {guest.nationality || "—"}
                </TableCell>
                <TableCell className="px-4 text-right tabular-nums">
                  {formatCount(guest.total_stays)}
                </TableCell>
                <TableCell className="px-4 text-right font-mono tabular-nums">
                  {formatCurrency(guest.total_spent)}
                </TableCell>
                {blacklist ? (
                  <TableCell className="max-w-64 px-4 whitespace-normal">
                    {guest.blacklist_reason || (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                ) : (
                  <TableCell className="px-4 text-sm text-muted-foreground tabular-nums">
                    {formatDate(guest.created_at)}
                  </TableCell>
                )}
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
        onPageChange={setPage}
        itemLabel="guests"
      />
    </div>
  )
}
