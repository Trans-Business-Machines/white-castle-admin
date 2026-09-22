"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader } from "lucide-react"
import { useForm } from "react-hook-form"
import toast from "react-hot-toast"
import { GuestFormFields } from "@/components/guests/guest-form-fields"
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
import { getApiErrorMessage } from "@/lib/api/errors"
import { guestsQueryKey, updateGuest } from "@/lib/api/guests"
import {
  guestSchema,
  toGuestFormValues,
  toGuestPayload,
  type GuestValues,
} from "@/lib/schemas/guests"
import type { Guest } from "@/lib/types"

interface EditGuestDialogProps {
  guest: Guest
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Edits a guest via `PATCH /guests/{id}`. The form is only mounted while
 * open so every open re-seeds from the latest `guest`.
 */
function EditGuestDialog(props: EditGuestDialogProps) {
  if (!props.open) return null
  return <EditGuestForm {...props} />
}

function EditGuestForm({ guest, onOpenChange }: EditGuestDialogProps) {
  const queryClient = useQueryClient()

  const form = useForm<GuestValues>({
    resolver: zodResolver(guestSchema),
    defaultValues: toGuestFormValues(guest),
  })
  const {
    handleSubmit,
    setError,
    formState: { errors },
  } = form

  const mutation = useMutation({
    mutationFn: (values: GuestValues) =>
      updateGuest(guest.guest_id, toGuestPayload(values)),
    onSuccess: async (saved) => {
      // Prefix key: refreshes the list and this guest's details together.
      await queryClient.invalidateQueries({ queryKey: guestsQueryKey })
      toast.success(`${saved.full_name}'s details were updated.`)
      onOpenChange(false)
    },
    onError: (error) => {
      setError("root", {
        message: getApiErrorMessage(
          error,
          "We couldn't update the guest. Try again."
        ),
      })
    },
  })

  function handleOpenChange(next: boolean) {
    // Ignore Escape / backdrop clicks while a request is in flight.
    if (mutation.isPending) return
    if (!next) onOpenChange(false)
  }

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto md:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-bold">
            Update {guest.full_name}
          </DialogTitle>
          <DialogDescription>
            Changes apply to this guest&apos;s record and future bookings.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          noValidate
        >
          <fieldset
            disabled={mutation.isPending}
            className="grid min-w-0 gap-4"
          >
            <GuestFormFields form={form} pending={mutation.isPending} />

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
                    Saving
                  </span>
                ) : (
                  "Save changes"
                )}
              </Button>
            </DialogFooter>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { EditGuestDialog }
