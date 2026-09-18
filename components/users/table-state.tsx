import { Skeleton } from "@/components/ui/skeleton"
import { TableCell, TableRow } from "@/components/ui/table"

/** Placeholder rows shown while a table's query is loading. */
function TableSkeletonRows({
  rows = 5,
  columns,
}: {
  rows?: number
  columns: number
}) {
  return Array.from({ length: rows }, (_, row) => (
    <TableRow key={row} className="hover:bg-transparent">
      {Array.from({ length: columns }, (_, column) => (
        <TableCell key={column} className="px-4 py-4">
          <Skeleton className="h-4 w-full max-w-40 rounded" />
        </TableCell>
      ))}
    </TableRow>
  ))
}

/** Single full-width row for empty and error states. */
function TableMessageRow({
  columns,
  children,
}: {
  columns: number
  children: React.ReactNode
}) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell
        colSpan={columns}
        className="px-4 py-12 text-center text-sm whitespace-normal text-muted-foreground"
      >
        {children}
      </TableCell>
    </TableRow>
  )
}

/** Inline error with a retry link, for use inside TableMessageRow. */
function TableError({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <span className="inline-flex flex-wrap items-center justify-center gap-2 text-destructive">
      {message}
      <button
        type="button"
        onClick={onRetry}
        className="font-semibold underline underline-offset-4"
      >
        Retry
      </button>
    </span>
  )
}

const tableHeadClassName =
  "h-12 bg-porcelain px-4 font-ibm-plex text-xs font-semibold tracking-wide text-muted-foreground uppercase first:rounded-tl-xl last:rounded-tr-xl dark:bg-muted/40"

export { TableSkeletonRows, TableMessageRow, TableError, tableHeadClassName }
