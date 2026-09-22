"use client"

import { useEffect, useState, type PropsWithChildren } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader } from "lucide-react"
import { useForm } from "react-hook-form"
import toast from "react-hot-toast"
import { BookingFormFields } from "@/components/bookings/booking-form-fields"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { bookingsQueryKey, createBooking } from "@/lib/api/bookings"
import { getApiErrorMessage } from "@/lib/api/errors"
import { fetchGuests, guestsQueryKey } from "@/lib/api/guests"
import { fetchUnits, unitsQueryKey } from "@/lib/api/units"
import {
  bookingSchema,
  toBookingPayload,
  type BookingValues,
} from "@/lib/schemas/bookings"
import type { Guest } from "@/lib/types"

/** How long a prefetched room / guest list is reused before refetching. */
const PREFETCH_STALE_MS = 30_000

const emptyValues: BookingValues = {
  room_id: "",
  guest_id: "",
  check_in_date: null,
  check_out_date: null,
  adults: 1,
  children: 0,
  special_requests: "",
}

export function NewBookingDialog({ children }: PropsWithChildren) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  // Warm the room and guest lists as soon as the page renders so the form
  // has its options the moment the dialog opens. `query` is a no-op while
  // the cached data is still fresh; failures are swallowed because the
  // `useQuery`s below surface them once the dialog is open.
  useEffect(() => {
    queryClient
      .query({
        queryKey: unitsQueryKey,
        queryFn: fetchUnits,
        staleTime: PREFETCH_STALE_MS,
      })
      .catch(() => undefined)
    queryClient
      .query({
        queryKey: guestsQueryKey,
        queryFn: fetchGuests,
        staleTime: PREFETCH_STALE_MS,
      })
      .catch(() => undefined)
  }, [queryClient])

  // Subscribed only while open: cached data renders instantly and a
  // background refetch picks up any rooms that changed status since.
  const rooms = useQuery({
    queryKey: unitsQueryKey,
    queryFn: fetchUnits,
    enabled: open,
  })
  const guests = useQuery({
    queryKey: guestsQueryKey,
    queryFn: fetchGuests,
    enabled: open,
  })

  const form = useForm<BookingValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: emptyValues,
  })
  const {
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = form

  const mutation = useMutation({
    mutationFn: ({ values, guest }: { values: BookingValues; guest: Guest }) =>
      createBooking(toBookingPayload(values, guest)),
    onSuccess: async (_, { guest }) => {
      // The booked room's status changes too, so refresh the units queries.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: bookingsQueryKey }),
        queryClient.invalidateQueries({ queryKey: unitsQueryKey }),
      ])
      toast.success(`Booking created for ${guest.full_name}.`)
      closeDialog()
    },
    onError: (error) => {
      setError("root", {
        message: getApiErrorMessage(
          error,
          "We couldn't create the booking. Try again."
        ),
      })
    },
  })

  function submit(values: BookingValues) {
    const guest = guests.data?.find((item) => item.guest_id === values.guest_id)
    if (!guest) {
      setError("guest_id", { message: "Choose a guest from the list." })
      return
    }
    mutation.mutate({ values, guest })
  }

  function closeDialog() {
    reset(emptyValues)
    mutation.reset()
    setOpen(false)
  }

  function handleOpenChange(next: boolean) {
    // Ignore Escape / backdrop clicks while a request is in flight.
    if (mutation.isPending) return
    if (next) {
      setOpen(true)
    } else {
      closeDialog()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto md:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-bold">
            Create a new booking
          </DialogTitle>
          <DialogDescription>
            Create a new booking for walk-in guests.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)} noValidate>
          <fieldset
            disabled={mutation.isPending}
            className="grid min-w-0 gap-4"
          >
            <BookingFormFields
              form={form}
              rooms={rooms}
              guests={guests}
              pending={mutation.isPending}
            />

            {errors.root ? (
              <p
                role="alert"
                className="rounded-md bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
              >
                {errors.root.message}
              </p>
            ) : null}

            <DialogFooter className="mt-2">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-full px-5"
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                className="h-11 flex-1 rounded-full bg-brand-azure px-5 text-white hover:bg-brand-azure/90 focus-visible:ring-brand-azure/30"
              >
                {mutation.isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader aria-hidden="true" className="animate-spin" />
                    Creating
                  </span>
                ) : (
                  "Create booking"
                )}
              </Button>
            </DialogFooter>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
  )
}
