"use client"

import { useState } from "react"
import { BbDateButton } from "@/components/catering/bb-date-button"
import { BbListTable } from "@/components/catering/bb-list-table"
import { BbStatsCards } from "@/components/catering/bb-stats-cards"
import { toBbListDate } from "@/lib/catering"
import { formatDate } from "@/lib/format"

/**
 * The bed and breakfast list for one day (today until another is picked):
 * the chosen day, the "Choose date" CTA, headline counts, then the table.
 */
export function CateringView() {
  const [date, setDate] = useState(() => new Date())
  const day = toBbListDate(date)

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Breakfast list for
          </p>
          <h2 className="font-heading text-xl font-bold text-brand-navy dark:text-foreground">
            {formatDate(date, "EEEE, d MMM yyyy")}
          </h2>
        </div>
        <BbDateButton value={date} onChange={setDate} />
      </div>

      <BbStatsCards date={day} />

      <div className="mt-6">
        <BbListTable date={day} />
      </div>
    </section>
  )
}
