"use client"

import { useState, type PropsWithChildren } from "react"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { getApiErrorMessage } from "@/lib/api/errors"
import {
  createGuest,
  guestsQueryKey,
  IdDocumentUploadError,
  uploadPickedIdDocument,
} from "@/lib/api/guests"
import {
  DEFAULT_ID_TYPE,
  guestSchema,
  toGuestPayload,
  type GuestValues,
} from "@/lib/schemas/guests"
import type { Guest } from "@/lib/types"

const emptyValues: GuestValues = {
  full_name: "",
  email: "",
  phone: "",
  id_type: DEFAULT_ID_TYPE,
  national_id: "",
  nationality: "",
  date_of_birth: null,
  id_document: [],
}

/**
 * Adds a guest in two steps, because the ID document hangs off a guest that
 * already exists: `POST /guests/create`, then `POST
 * /guests/{id}/id-document` for the picked file. If the upload fails the
 * dialog keeps the created guest, locks the details and resubmitting only
 * retries the upload.
 */
export function NewGuestDialog({ children }: PropsWithChildren) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  // Set once the guest is saved so a failed upload can be retried without
  // creating the guest a second time.
  const [savedGuest, setSavedGuest] = useState<Guest | null>(null)

  const form = useForm<GuestValues>({
    resolver: zodResolver(guestSchema),
    defaultValues: emptyValues,
  })
  const {
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = form

  const mutation = useMutation({
    mutationFn: async (values: GuestValues) => {
      let saved = savedGuest
      if (!saved) {
        saved = await createGuest(toGuestPayload(values))
        setSavedGuest(saved)
        queryClient.invalidateQueries({ queryKey: guestsQueryKey })
      }
      await uploadPickedIdDocument(saved.guest_id, values.id_document)
      return saved
    },
    onSuccess: async (guest) => {
      await queryClient.invalidateQueries({ queryKey: guestsQueryKey })
      toast.success(`${guest.full_name} added as a guest.`)
      closeDialog()
    },
    onError: (error) => {
      if (error instanceof IdDocumentUploadError) {
        setError("root", {
          message: `The guest was added, but the ID document didn't upload: ${getApiErrorMessage(
            error.cause,
            "something went wrong."
          )} Try again to retry the upload, or cancel to add it later.`,
        })
        return
      }
      setError("root", {
        message: getApiErrorMessage(
          error,
          "We couldn't save the guest. Try again."
        ),
      })
    },
  })

  function closeDialog() {
    reset(emptyValues)
    setSavedGuest(null)
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

      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-bold">
            Add guest
          </DialogTitle>
          <DialogDescription>
            Guest records are reused for walk-ins and future bookings.
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
            <GuestFormFields
              form={form}
              pending={mutation.isPending}
              detailsLocked={Boolean(savedGuest)}
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
                    Saving
                  </span>
                ) : (
                  "Add guest"
                )}
              </Button>
            </DialogFooter>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
  )
}
