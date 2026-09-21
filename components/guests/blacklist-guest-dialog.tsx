"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Ban, Loader } from "lucide-react"
import { useForm } from "react-hook-form"
import toast from "react-hot-toast"
import { ConfirmDialog } from "@/components/confirm-dialog"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getApiErrorMessage } from "@/lib/api/errors"
import {
  blacklistGuest,
  guestsQueryKey,
  unblacklistGuest,
} from "@/lib/api/guests"
import {
  blacklistSchema,
  toBlacklistPayload,
  type BlacklistValues,
} from "@/lib/schemas/guests"
import type { Guest } from "@/lib/types"

interface BlacklistGuestDialogProps {
  guest: Pick<Guest, "guest_id" | "full_name" | "blacklisted">
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Toggles a guest's blacklist flag. Blacklisting asks for a reason
 * (`PATCH /guests/{id}/blacklist` with `{ reason }`); removing them only
 * needs a confirmation (`PATCH /guests/{id}/unblacklist`). Shared by the
 * table row menu and the profile page.
 */
function BlacklistGuestDialog(props: BlacklistGuestDialogProps) {
  if (props.guest.blacklisted) return <UnblacklistConfirm {...props} />
  // Mounted only while open so the reason field starts empty each time.
  if (!props.open) return null
  return <BlacklistReasonForm {...props} />
}

function UnblacklistConfirm({
  guest,
  open,
  onOpenChange,
}: BlacklistGuestDialogProps) {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => unblacklistGuest(guest.guest_id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: guestsQueryKey })
      toast.success(`${guest.full_name} was removed from the blacklist.`)
      setError(null)
      onOpenChange(false)
    },
    onError: (err) => {
      setError(
        getApiErrorMessage(
          err,
          "We couldn't remove this guest from the blacklist. Try again."
        )
      )
    },
  })

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setError(null)
        onOpenChange(next)
      }}
      title={`Remove ${guest.full_name} from the blacklist?`}
      description="They will be able to make new bookings again. Their history is kept."
      confirmLabel="Remove from blacklist"
      pendingLabel="Removing"
      isPending={mutation.isPending}
      error={error}
      onConfirm={() => mutation.mutate()}
    />
  )
}

function BlacklistReasonForm({
  guest,
  onOpenChange,
}: BlacklistGuestDialogProps) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<BlacklistValues>({
    resolver: zodResolver(blacklistSchema),
    defaultValues: { reason: "" },
  })

  const mutation = useMutation({
    mutationFn: (values: BlacklistValues) =>
      blacklistGuest(guest.guest_id, toBlacklistPayload(values)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: guestsQueryKey })
      toast.success(`${guest.full_name} was blacklisted.`)
      onOpenChange(false)
    },
    onError: (err) => {
      setError("root", {
        message: getApiErrorMessage(
          err,
          "We couldn't blacklist this guest. Try again."
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
            Blacklist {guest.full_name}?
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            They won&apos;t be able to make new bookings until they are removed
            from the blacklist. The reason is kept on their record so other
            staff know why.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          noValidate
        >
          <fieldset disabled={mutation.isPending} className="grid gap-4">
            <div className="grid gap-2">
              <Label
                htmlFor="guest-blacklist-reason"
                className="font-heading text-xs font-semibold tracking-wide text-iron uppercase"
              >
                Reason
              </Label>
              <Textarea
                id="guest-blacklist-reason"
                autoFocus
                rows={4}
                placeholder="e.g. Left without settling their bill on 12 Aug 2026."
                className="min-h-28 rounded-lg border-border bg-canvas px-3.5 py-2.5 text-base focus-visible:border-brand-azure focus-visible:ring-brand-azure/20 md:text-base dark:bg-input/30"
                aria-invalid={Boolean(errors.reason)}
                aria-describedby={
                  errors.reason ? "guest-blacklist-reason-error" : undefined
                }
                {...register("reason")}
              />
              {errors.reason ? (
                <p
                  id="guest-blacklist-reason-error"
                  className="text-sm text-destructive"
                >
                  {errors.reason.message}
                </p>
              ) : null}
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
                className="h-11 rounded-full bg-destructive px-5 text-white hover:bg-destructive/90 focus-visible:ring-destructive/30"
              >
                {mutation.isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader aria-hidden="true" className="animate-spin" />
                    Blacklisting
                  </span>
                ) : (
                  <>
                    <Ban aria-hidden="true" />
                    Blacklist guest
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

export { BlacklistGuestDialog }
