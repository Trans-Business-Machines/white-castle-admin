import type { ReactNode } from "react"
import Link from "next/link"
import { cn } from "cn"
import { ArrowLeft } from "lucide-react"
import { AuditActionBadge } from "@/components/audits/audit-action-badge"
import { RoleBadge } from "@/components/role-badge"
import { TablePagination } from "@/components/table-pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  TableError,
  TableMessageRow,
  TableSkeletonRows,
  tableHeadClassName,
} from "@/components/users/table-state"
import { getApiErrorMessage } from "@/lib/api/errors"
import { formatAuditTimestamp } from "@/lib/audit"
import { formatCount } from "@/lib/reports"
import type { AuditLogEntry } from "@/lib/types"

const COLUMNS = 6

export function EmptyCell() {
  return <span className="text-muted-foreground">—</span>
}

interface AuditLogHeaderProps {
  title: string
  description: string
  /** Right-hand action, e.g. an export button. */
  action?: ReactNode
}

/** Back link to `/audits`, the log's title and description, and an action. */
export function AuditLogHeader({
  title,
  description,
  action,
}: AuditLogHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <Link
          href="/audits"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          All audit logs
        </Link>
        <h2 className="mt-2 font-heading text-2xl font-bold text-brand-navy dark:text-foreground">
          {title}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>

      {action}
    </header>
  )
}

interface AuditLogTableProps {
  /** The current page's rows; undefined until the first page loads. */
  entries: AuditLogEntry[] | undefined
  status: "pending" | "error" | "success"
  error: unknown
  onRetry: () => void
  /** True while the previous page is shown dimmed as the next one loads. */
  isPlaceholderData: boolean
  page: number
  pageSize: number
  /** Every matching entry across all pages, from the response. */
  total: number
  onPageChange: (page: number) => void
  emptyMessage: string
  /** The Target cell: what the action touched. */
  renderTarget: (entry: AuditLogEntry) => ReactNode
  /** Left side of the bar above the table, e.g. a filter. */
  toolbar?: ReactNode
}

/**
 * Time · Username · Role · Action · Target · IP address, for one page of
 * an audit log paginated by the backend. The footer pages through `total`.
 */
export function AuditLogTable({
  entries,
  status,
  error,
  onRetry,
  isPlaceholderData,
  page,
  pageSize,
  total,
  onPageChange,
  emptyMessage,
  renderTarget,
  toolbar,
}: AuditLogTableProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/10">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        {toolbar ?? <span />}
        {status === "success" ? (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground tabular-nums">
              {formatCount(total)}
            </span>{" "}
            {total === 1 ? "event" : "events"}
          </p>
        ) : null}
      </div>

      <Table
        className={cn("transition-opacity", isPlaceholderData && "opacity-60")}
      >
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={tableHeadClassName}>Time</TableHead>
            <TableHead className={tableHeadClassName}>Username</TableHead>
            <TableHead className={tableHeadClassName}>Role</TableHead>
            <TableHead className={tableHeadClassName}>Action</TableHead>
            <TableHead className={tableHeadClassName}>Target</TableHead>
            <TableHead className={tableHeadClassName}>IP address</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {status === "pending" ? (
            <TableSkeletonRows rows={pageSize} columns={COLUMNS} />
          ) : status === "error" ? (
            <TableMessageRow columns={COLUMNS}>
              <TableError
                message={getApiErrorMessage(
                  error,
                  "We couldn't load the audit log."
                )}
                onRetry={onRetry}
              />
            </TableMessageRow>
          ) : !entries?.length ? (
            <TableMessageRow columns={COLUMNS}>{emptyMessage}</TableMessageRow>
          ) : (
            entries.map((entry) => (
              <AuditLogRow
                key={entry.id}
                entry={entry}
                target={renderTarget(entry)}
              />
            ))
          )}
        </TableBody>
      </Table>

      {status === "success" ? (
        <TablePagination
          page={Math.min(page, pageCount)}
          pageCount={pageCount}
          pageSize={pageSize}
          total={total}
          onPageChange={onPageChange}
          itemLabel="events"
        />
      ) : null}
    </div>
  )
}

function AuditLogRow({
  entry,
  target,
}: {
  entry: AuditLogEntry
  target: ReactNode
}) {
  return (
    <TableRow className="h-14">
      <TableCell className="px-4 text-sm text-muted-foreground tabular-nums">
        {formatAuditTimestamp(entry.timestamp)}
      </TableCell>
      <TableCell className="px-4 font-semibold text-foreground">
        {entry.username ?? (
          <span className="font-normal text-muted-foreground">
            Unknown user
          </span>
        )}
      </TableCell>
      <TableCell className="px-4">
        {entry.role ? <RoleBadge role={entry.role} /> : <EmptyCell />}
      </TableCell>
      <TableCell className="px-4">
        <AuditActionBadge action={entry.action} />
      </TableCell>
      <TableCell className="px-4 text-sm">{target}</TableCell>
      <TableCell className="px-4 font-mono text-sm">
        {entry.ip_address || <EmptyCell />}
      </TableCell>
    </TableRow>
  )
}
