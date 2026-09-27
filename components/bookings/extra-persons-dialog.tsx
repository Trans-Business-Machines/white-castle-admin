"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader, UserPlus } from "lucide-react"
import { useForm } from "react-hook-form"
import toast from "react-hot-toast"
import {
  FieldError,
  inputClassName,
  labelClassName,
} from "@/components/bookings/booking-form-fields"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { addExtraPersons, bookingsQueryKey } from "@/lib/api/bookings"
import { getApiErrorMessage } from "@/lib/api/errors"
import {
  extraPersonsSchema,
  MAX_OCCUPANTS,
  toExtraPersonsPayload,
  type ExtraPersonsValues,
} from "@/lib/schemas/bookings"
import type { Booking } from "@/lib/types"
import { useAuth } from "@/providers/auth-provider"

interface ExtraPersonsDialogProps {
  booking: Booking
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Adds adults / children to a checked-in stay (`PATCH
 * /bookings/{id}/extra-persons`) with the signed-in staff member's
 * `user_id` as `updated_by`.
 */
function ExtraPersonsDialog(props: ExtraPersonsDialogProps) {
  // Mounted only while open so the counts start at zero each time.
  if (!props.open) return null
  return <ExtraPersonsForm {...props} />
}

function ExtraPersonsForm({
  booking,
  onOpenChange,
}: Omit<ExtraPersonsDialogProps, "open">) {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ExtraPersonsValues>({
    resolver: zodResolver(extraPersonsSchema),
    defaultValues: { adults: 0, children: 0 },
  })

  const mutation = useMutation({
    mutationFn: (values: ExtraPersonsValues) => {
      if (!user) throw new Error("Sign in again to add people to this stay.")
      return addExtraPersons(
        booking.booking_id,
        toExtraPersonsPayload(values, user.user_id)
      )
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: bookingsQueryKey })
      toast.success(`Booking ${booking.reference} was updated.`)
      onOpenChange(false)
    },
    onError: (err) => {
      setError("root", {
        message: getApiErrorMessage(
          err,
          "We couldn't add people to this stay. Try again."
        ),
      })
    },
  })

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        // Ignore Escape / backdrop clicks while a request is in flight.
        if (mutation.isPending) return
        if (!next) onOpenChange(false)
      }}
    >
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Add extra people
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            Booking{" "}
            <span className="font-semibold text-foreground">
              {booking.reference}
            </span>{" "}
            is currently for {booking.adults}{" "}
            {booking.adults === 1 ? "adult" : "adults"} and {booking.children}{" "}
            {booking.children === 1 ? "child" : "children"}. Enter how many are
            joining the stay.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          noValidate
        >
          <fieldset disabled={mutation.isPending} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="extra-adults" className={labelClassName}>
                  Extra adult
                </Label>
                <Input
                  id="extra-adults"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={MAX_OCCUPANTS}
                  step={1}
                  autoFocus
                  className={inputClassName}
                  aria-invalid={Boolean(errors.adults)}
                  aria-describedby={
                    errors.adults ? "extra-adults-error" : undefined
                  }
                  {...register("adults", { valueAsNumber: true })}
                />
                <FieldError
                  id="extra-adults-error"
                  message={errors.adults?.message}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="extra-children" className={labelClassName}>
                  Extra child
                </Label>
                <Input
                  id="extra-children"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={MAX_OCCUPANTS}
                  step={1}
                  className={inputClassName}
                  aria-invalid={Boolean(errors.children)}
                  aria-describedby={
                    errors.children ? "extra-children-error" : undefined
                  }
                  {...register("children", { valueAsNumber: true })}
                />
                <FieldError
                  id="extra-children-error"
                  message={errors.children?.message}
                />
              </div>
            </div>

            {errors.root ? (
              <p
                role="alert"
                className="rounded-md bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
              >
                {errors.root.message}
              </p>
            ) : null}

            <DialogFooter>
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
                className="h-11 rounded-full bg-brand-azure px-5 text-white hover:bg-brand-azure/90 focus-visible:ring-brand-azure/30"
              >
                {mutation.isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader aria-hidden="true" className="animate-spin" />
                    Saving
                  </span>
                ) : (
                  <>
                    <UserPlus aria-hidden="true" />
                    Add to stay
                  </>
                )}
              </Button>
            </DialogFooter>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { ExtraPersonsDialog }
