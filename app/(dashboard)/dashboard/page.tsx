import { Suspense } from "react"
import type { Metadata } from "next"
import { DashboardView } from "@/components/dashboard/dashboard-view"
import { StatCardSkeleton } from "@/components/dashboard/report-state"

export const metadata: Metadata = { title: "Dashboard" }

/** Stand-in while the client reads the URL's date range. */
function DashboardFallback() {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(15rem,100%),1fr))] gap-4">
      {Array.from({ length: 4 }, (_, index) => (
        <StatCardSkeleton key={index} />
      ))}
    </div>
  )
}

export default function Dashboard() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardView />
    </Suspense>
  )
}
