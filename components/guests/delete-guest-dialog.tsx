"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { getApiErrorMessage } from "@/lib/api/errors"
import { deleteGuest, guestQueryKey, guestsQueryKey } from "@/lib/api/guests"
import type { Guest } from "@/lib/types"

interface DeleteGuestDialogProps {
  guest: Pick<Guest, "guest_id" | "full_name">
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Runs after the guest is gone, e.g. to leave their profile page. */
  onDeleted?: () => void
}

/**
 * Confirms then runs `DELETE /guests/{id}`. The menu only offers it to
 * admins and super admins (`GUEST_DELETE_ROLES`).
 */
function DeleteGuestDialog({
  guest,
  open,
  onOpenChange,
  onDeleted,
}: DeleteGuestDialogProps) {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => deleteGuest(guest.guest_id),
    onSuccess: async () => {
      // Drop the deleted guest's own queries rather than refetch them into a
      // 404, then refresh the list and the stats cards.
      queryClient.removeQueries({ queryKey: guestQueryKey(guest.guest_id) })
      await queryClient.invalidateQueries({ queryKey: guestsQueryKey })
      toast.success(`${guest.full_name} was deleted.`)
      setError(null)
      onOpenChange(false)
      onDeleted?.()
    },
    onError: (err) => {
      setError(
        getApiErrorMessage(err, "We couldn't delete this guest. Try again.")
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
      title={`Delete ${guest.full_name}?`}
      description="This permanently removes the guest's record. This action is not reversible."
      confirmLabel="Delete guest"
      pendingLabel="Deleting"
      destructive
      isPending={mutation.isPending}
      error={error}
      onConfirm={() => mutation.mutate()}
    />
  )
}

export { DeleteGuestDialog }
