import { cn } from "cn"
import { ReportError } from "@/components/dashboard/report-state"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface ChartCardProps {
  title: string
  description: string
  /** Shows a placeholder body instead of `children`. */
  loading?: boolean
  /** Shows this error (with retry) instead of `children`. */
  error?: string
  onRetry?: () => void
  /** Dims the body while fresher data is on its way. */
  stale?: boolean
  children: React.ReactNode
}

/** Card chrome shared by the dashboard's chart tiles. */
export function ChartCard({
  title,
  description,
  loading,
  error,
  onRetry,
  stale,
  children,
}: ChartCardProps) {
  return (
    <Card className="h-full border-iron shadow-md">
      <CardHeader>
        <CardTitle className="font-sans font-bold text-neutral uppercase">
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent
        className={cn(
          "flex flex-1 flex-col justify-center",
          stale && "opacity-60 transition-opacity"
        )}
      >
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="mx-auto h-36 w-36 rounded-full" />
            <Skeleton className="mx-auto h-4 w-40 rounded" />
          </div>
        ) : error ? (
          <ReportError message={error} onRetry={onRetry ?? (() => undefined)} />
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}
