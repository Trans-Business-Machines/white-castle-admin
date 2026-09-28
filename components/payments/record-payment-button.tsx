"use client"

import { useEffect, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { EMPTY_BOOKING_FILTERS } from "@/components/bookings/bookings-filters"
import { RecordPaymentDialog } from "@/components/payments/record-payment-dialog"
import { Button } from "@/components/ui/button"
import { bookingsListQueryKey, fetchBookings } from "@/lib/api/bookings"
import {
  DEPOSIT_PERCENTAGE_KEY,
  fetchSetting,
  settingQueryKey,
} from "@/lib/api/settings"

/** How long a prefetched bookings list is reused before refetching. */
const PREFETCH_STALE_MS = 30_000

/** Opens the record-payment form with an empty booking picker. */
export function RecordPaymentButton() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  // Warm the bookings list (and the deposit percentage the amount is
  // pre-filled from) as soon as the page renders so the picker has its
  // options the moment the dialog opens. `query` is a no-op while the
  // cached data is still fresh; failures are swallowed because the dialog's
  // own `useQuery` surfaces them once it's open.
  useEffect(() => {
    queryClient
      .query({
        queryKey: bookingsListQueryKey(EMPTY_BOOKING_FILTERS),
        queryFn: () => fetchBookings(EMPTY_BOOKING_FILTERS),
        staleTime: PREFETCH_STALE_MS,
      })
      .catch(() => undefined)
    queryClient
      .query({
        queryKey: settingQueryKey(DEPOSIT_PERCENTAGE_KEY),
        queryFn: () => fetchSetting(DEPOSIT_PERCENTAGE_KEY),
        staleTime: PREFETCH_STALE_MS,
      })
      .catch(() => undefined)
  }, [queryClient])

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="h-11 rounded-md bg-brand-azure px-5 text-white hover:bg-brand-azure/90 focus-visible:ring-brand-azure/30"
      >
        <span className="text-base text-white">Record payment</span>
        <Plus size={22} color="#ffffff" className="font-bold" />
      </Button>

      <RecordPaymentDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
