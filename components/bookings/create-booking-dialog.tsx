"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  useIsMutating,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { Loader, Plus } from "lucide-react"
import { useForm } from "react-hook-form"
import toast from "react-hot-toast"
import { CreateBookingFields } from "@/components/bookings/create-booking-fields"
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
  createBookingSchema,
  DEFAULT_MEAL_PLAN,
  toCreateBookingPayload,
  type CreateBookingValues,
} from "@/lib/schemas/bookings"
import { BOOKING_CREATE_ROLES, hasRole } from "@/lib/roles"
import type { Guest } from "@/lib/types"
import { useAuth } from "@/providers/auth-provider"

const createBookingMutationKey = ["bookings", "create"] as const

/** How long the prefetched room / guest lists are reused before refetching. */
const PREFETCH_STALE_MS = 30_000

const emptyValues: CreateBookingValues = {
  guest_id: "",
  room_id: "",
  check_in_date: null,
  check_out_date: null,
  adults: 1,
  children: 0,
  meal_plan: DEFAULT_MEAL_PLAN,
  special_requests: "",
}

/**
 * "Create booking" CTA plus the dialog it opens; hidden from finance (and
 * any role outside `BOOKING_CREATE_ROLES`), who then skip the prefetch too.
 */
export function CreateBookingDialog() {
  const { user } = useAuth()

  if (!hasRole(user?.role, BOOKING_CREATE_ROLES)) return null

  return <CreateBookingCta />
}

function CreateBookingCta() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const saving = useIsMutating({ mutationKey: createBookingMutationKey }) > 0

  // Warm the room and guest lists so the pickers are populated the moment
  // the dialog opens; the form's own queries surface any failure.
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

  function handleOpenChange(next: boolean) {
    // Ignore Escape / backdrop clicks while the booking is saving.
    if (saving) return
    setOpen(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="h-11 rounded-md bg-brand-azure px-5 text-base text-white hover:bg-brand-azure/90 focus-visible:ring-brand-azure/30">
          Create booking
          <Plus aria-hidden="true" className="size-5" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-bold">
            Create a booking
          </DialogTitle>
          <DialogDescription>
            Book a room for a guest already on record.
          </DialogDescription>
        </DialogHeader>

        {/* Mounted only while open so every open starts from a blank form. */}
        {open ? <CreateBookingForm onDone={() => setOpen(false)} /> : null}
      </DialogContent>
    </Dialog>
  )
}

function CreateBookingForm({ onDone }: { onDone: () => void }) {
  const queryClient = useQueryClient()

  const rooms = useQuery({ queryKey: unitsQueryKey, queryFn: fetchUnits })
  const guests = useQuery({ queryKey: guestsQueryKey, queryFn: fetchGuests })

  const form = useForm<CreateBookingValues>({
    resolver: zodResolver(createBookingSchema),
    defaultValues: emptyValues,
  })
  const {
    handleSubmit,
    setError,
    formState: { errors },
  } = form

  const mutation = useMutation({
    mutationKey: createBookingMutationKey,
    mutationFn: ({
      values,
      guest,
    }: {
      values: CreateBookingValues
      guest: Guest
    }) => createBooking(toCreateBookingPayload(values, guest)),
    onSuccess: async (_, { guest }) => {
      // The booked room's status changes too, so refresh the units queries.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: bookingsQueryKey }),
        queryClient.invalidateQueries({ queryKey: unitsQueryKey }),
      ])
      toast.success(`Booking created for ${guest.full_name}.`)
      onDone()
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

  function submit(values: CreateBookingValues) {
    const guest = guests.data?.find((item) => item.guest_id === values.guest_id)
    if (!guest) {
      setError("guest_id", { message: "Choose a guest from the list." })
      return
    }
    mutation.mutate({ values, guest })
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate>
      <fieldset disabled={mutation.isPending} className="grid min-w-0 gap-4">
        <CreateBookingFields
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
  )
}
