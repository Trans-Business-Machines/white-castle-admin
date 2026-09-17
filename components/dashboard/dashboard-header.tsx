"use client"

import { usePathname } from "next/navigation"
import { CalendarDays } from "lucide-react"
import { findNavItem } from "@/components/dashboard/nav"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { formatDate } from "@/lib/format"

function DashboardHeader() {
  const pathname = usePathname()
  const page = findNavItem(pathname)
  const today = formatDate(new Date())

  return (
    <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background px-4 py-3 md:px-8 md:py-4">
      <SidebarTrigger className="-ml-1 md:hidden" />

      <div className="min-w-0 flex-1">
        <h1 className="truncate font-heading text-xl font-bold tracking-tight text-foreground md:text-2xl">
          {page?.title ?? "White Castle"}
        </h1>
        {page?.description ? (
          <p className="hidden truncate text-sm text-muted-foreground sm:block">
            {page.description}
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium text-foreground sm:flex">
          <CalendarDays
            aria-hidden="true"
            className="size-4 text-muted-foreground"
          />
          <time dateTime={formatDate(new Date(), "yyyy-MM-dd")}>{today}</time>
        </div>
      </div>
    </header>
  )
}

export { DashboardHeader }
