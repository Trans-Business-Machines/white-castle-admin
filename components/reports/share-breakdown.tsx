import type { ReactNode } from "react"
import { cn } from "cn"
import { formatPercent } from "@/lib/bookings"
import type { ShareSegment } from "@/lib/reports"

interface ShareBreakdownProps {
  title: string
  /** The whole the segments are shares of. */
  total: number
  /** Readable total, e.g. "KES 768,930" or "10 bookings". */
  totalLabel: string
  segments: ShareSegment[]
  format: (value: number) => string
  /** Shown instead of the bar when `total` is 0. */
  emptyMessage: string
  className?: string
}

/**
 * A part-to-whole panel: one stacked bar (2px gaps between fills) with a
 * legend that carries every value and share, so nothing is read from colour
 * alone. Hovering a segment shows the same figures.
 */
export function ShareBreakdown({
  title,
  total,
  totalLabel,
  segments,
  format,
  emptyMessage,
  className,
}: ShareBreakdownProps) {
  const share = (value: number) => formatPercent((value / total) * 100)

  return (
    <ReportPanel title={title} aside={totalLabel} className={className}>
      {total > 0 ? (
        <>
          <div aria-hidden="true" className="flex h-3 gap-0.5">
            {segments
              .filter((segment) => segment.value > 0)
              .map((segment) => (
                <div
                  key={segment.key}
                  title={`${segment.label}: ${format(segment.value)} (${share(segment.value)})`}
                  className={cn(
                    "h-full min-w-1 first:rounded-l-full last:rounded-r-full",
                    segment.className
                  )}
                  style={{ flexGrow: segment.value, flexBasis: 0 }}
                />
              ))}
          </div>

          <ul className="mt-4 grid gap-2.5">
            {segments.map((segment) => (
              <li
                key={segment.key}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="inline-flex min-w-0 items-center gap-2 text-foreground">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-2.5 shrink-0 rounded-sm",
                      segment.className
                    )}
                  />
                  <span className="min-w-0">
                    {segment.label}
                    {segment.detail ? (
                      <span className="block text-xs text-muted-foreground">
                        {segment.detail}
                      </span>
                    ) : null}
                  </span>
                </span>
                <span className="text-right tabular-nums">
                  <span className="font-semibold text-foreground">
                    {format(segment.value)}
                  </span>{" "}
                  <span className="text-muted-foreground">
                    · {share(segment.value)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      )}
    </ReportPanel>
  )
}

interface ReportPanelProps {
  title: string
  /** Small figure on the right of the title, e.g. the panel's total. */
  aside?: string
  children: ReactNode
  className?: string
}

/** Titled surface for a report section; matches the settings sections. */
export function ReportPanel({
  title,
  aside,
  children,
  className,
}: ReportPanelProps) {
  return (
    <section
      className={cn(
        "rounded-xl bg-card p-5 shadow-sm ring-1 ring-foreground/10",
        className
      )}
    >
      <header className="mb-4 flex items-baseline justify-between gap-3">
        <h3 className="font-heading text-xs font-bold tracking-wide text-iron uppercase">
          {title}
        </h3>
        {aside ? (
          <span className="text-sm font-semibold text-foreground tabular-nums">
            {aside}
          </span>
        ) : null}
      </header>
      {children}
    </section>
  )
}
