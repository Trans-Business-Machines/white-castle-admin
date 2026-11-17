"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader } from "lucide-react"
import { useForm } from "react-hook-form"
import toast from "react-hot-toast"
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
import { guestsQueryKey, recommendBlacklistGuest } from "@/lib/api/guests"
import {
  blacklistSchema,
  toBlacklistPayload,
  type BlacklistValues,
} from "@/lib/schemas/guests"
import type { Guest } from "@/lib/types"

interface Props {
  guest: Pick<Guest, "guest_id" | "full_name" | "blacklist_recommended">
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Receptionists cannot blacklist a guest directly. They record a
 * recommendation and a manager approves or dismisses it.
 */
export function BlacklistRecommendDialog({ guest, open, onOpenChange }: Props) {
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BlacklistValues>({
    resolver: zodResolver(blacklistSchema),
    defaultValues: { reason: "" },
  })

  const mutation = useMutation({
    mutationFn: (values: BlacklistValues) =>
      recommendBlacklistGuest(guest.guest_id, toBlacklistPayload(values)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: guestsQueryKey })
      toast.success(
        `Blacklist recommendation for ${guest.full_name} sent to a manager.`
      )
      reset()
      setError(null)
      onOpenChange(false)
    },
    onError: (err) => {
      setError(getApiErrorMessage(err, "We couldn't send this recommendation."))
    },
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (mutation.isPending) return
        if (!next) {
          reset()
          setError(null)
        }
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Recommend blacklisting {guest.full_name}?
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            A manager or super admin reviews this recommendation. The guest
            stays in good standing until they approve it.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          noValidate
        >
          <fieldset disabled={mutation.isPending} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="guest-blacklist-recommend-reason">Reason</Label>
              <Textarea
                id="guest-blacklist-recommend-reason"
                autoFocus
                rows={4}
                placeholder="e.g. Left without settling their bill on 12 Aug 2026."
                className="min-h-28 rounded-lg border-border bg-canvas px-3.5 py-2.5 text-base focus-visible:border-brand-azure focus-visible:ring-brand-azure/20 md:text-base dark:bg-input/30"
                aria-invalid={Boolean(errors.reason)}
                aria-describedby={
                  errors.reason
                    ? "guest-blacklist-recommend-reason-error"
                    : undefined
                }
                {...register("reason")}
              />
              {errors.reason ? (
                <p
                  id="guest-blacklist-recommend-reason-error"
                  className="text-sm text-destructive"
                >
                  {errors.reason.message}
                </p>
              ) : null}
            </div>

            {error ? (
              <p
                role="alert"
                className="rounded-md bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
              >
                {error}
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
                className="h-11 rounded-full bg-amber-600 px-5 text-white hover:bg-amber-600/90 focus-visible:ring-amber-600/30"
              >
                {mutation.isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader aria-hidden="true" className="animate-spin" />
                    Sending
                  </span>
                ) : (
                  "Send recommendation"
                )}
              </Button>
            </DialogFooter>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
  )
}
