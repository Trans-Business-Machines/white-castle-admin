"use client"

import { Label, Pie, PieChart } from "recharts"
import { ChartCard } from "@/components/dashboard/chart-card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { useDashboardReports } from "@/hooks/use-dashboard-reports"
import { getApiErrorMessage } from "@/lib/api/errors"
import type { ReportRange } from "@/lib/api/reports"
import { getPaymentMix, PAYMENT_MIX_COLORS, toShare } from "@/lib/dashboard"

const config = {
  fully_paid: { label: "Fully paid", color: PAYMENT_MIX_COLORS.fully_paid },
  deposit_only: {
    label: "Deposit only",
    color: PAYMENT_MIX_COLORS.deposit_only,
  },
  unpaid: { label: "Unpaid", color: PAYMENT_MIX_COLORS.unpaid },
  none: { label: "No bookings", color: "var(--color-muted)" },
} satisfies ChartConfig

/** Donut of the period's bookings by how much of their bill is settled. */
export function PaymentMixChart({ range }: { range: ReportRange }) {
  const { revenue } = useDashboardReports(range)
  const slices = revenue.data ? getPaymentMix(revenue.data) : []
  const total = revenue.data?.total_bookings ?? 0

  // Zero-value slices are dropped from the ring (they'd render as invisible
  // wedges that still catch hover) but stay in the legend below.
  const data =
    total > 0
      ? slices
          .filter((slice) => slice.value > 0)
          .map((slice) => ({
            key: slice.key,
            value: slice.value,
            fill: `var(--color-${slice.key})`,
          }))
      : [{ key: "none", value: 1, fill: "var(--color-none)" }]

  return (
    <ChartCard
      title="Payment mix"
      description="How far bookings in this period have paid."
      loading={revenue.isPending}
      error={
        revenue.isError
          ? getApiErrorMessage(revenue.error, "Could not load the payment mix.")
          : undefined
      }
      onRetry={() => revenue.refetch()}
      stale={revenue.isPlaceholderData}
    >
      <div className="flex flex-wrap items-center justify-center gap-6">
        <ChartContainer config={config} className="aspect-square w-40 shrink-0">
          <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            {total > 0 ? (
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent nameKey="key" hideLabel />}
              />
            ) : null}
            <Pie
              data={data}
              dataKey="value"
              nameKey="key"
              innerRadius="68%"
              outerRadius="100%"
              stroke="var(--card)"
              strokeWidth={2}
              isAnimationActive={false}
            >
              <Label
                content={({ viewBox }) => {
                  if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) {
                    return null
                  }
                  const cx = viewBox.cx ?? 0
                  const cy = viewBox.cy ?? 0
                  return (
                    <text x={cx} y={cy} textAnchor="middle">
                      <tspan
                        x={cx}
                        y={cy - 4}
                        className="fill-foreground font-heading text-3xl font-bold"
                      >
                        {total}
                      </tspan>
                      <tspan
                        x={cx}
                        y={cy + 16}
                        className="fill-muted-foreground text-xs"
                      >
                        {total === 1 ? "booking" : "bookings"}
                      </tspan>
                    </text>
                  )
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>

        <dl className="grid min-w-44 gap-2 text-sm">
          {slices.map((slice) => (
            <div
              key={slice.key}
              className="flex items-center justify-between gap-4"
            >
              <dt className="flex items-center gap-2 text-muted-foreground">
                <span
                  aria-hidden="true"
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: PAYMENT_MIX_COLORS[slice.key] }}
                />
                {slice.label}
              </dt>
              <dd className="font-semibold text-foreground tabular-nums">
                {slice.value}
                <span className="ml-1 font-normal text-muted-foreground">
                  ({Math.round(toShare(slice.value, total))}%)
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </ChartCard>
  )
}
