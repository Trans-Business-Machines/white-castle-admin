import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

/** Placeholder card matching a StatCard's footprint while a report loads. */
export function StatCardSkeleton() {
  return (
    <Card className="border-iron shadow-md">
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-24 rounded" />
        <Skeleton className="h-9 w-28 rounded" />
        <Skeleton className="h-4 w-16 rounded" />
      </CardContent>
    </Card>
  )
}

/** Inline failure notice with a retry link, for any dashboard section. */
export function ReportError({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <p className="inline-flex flex-wrap items-center gap-2 text-sm text-destructive">
      {message}
      <button
        type="button"
        onClick={onRetry}
        className="font-semibold underline underline-offset-4"
      >
        Retry
      </button>
    </p>
  )
}
