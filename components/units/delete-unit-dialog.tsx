"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { getApiErrorMessage } from "@/lib/api/errors"
import { deleteUnit, unitsQueryKey } from "@/lib/api/units"
import type { Unit } from "@/lib/types"

interface DeleteUnitDialogProps {
  unit: Pick<Unit, "room_id" | "room_number">
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Runs after the room is gone, e.g. to leave its details page. */
  onDeleted?: () => void
}

/**
 * Confirms then runs `DELETE /bookings/rooms/{id}`. Shared by the table row
 * menu and the unit details page so the copy and cache handling stay in sync.
 */
function DeleteUnitDialog({
  unit,
  open,
  onOpenChange,
  onDeleted,
}: DeleteUnitDialogProps) {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => deleteUnit(unit.room_id),
    onSuccess: async () => {
      // Invalidates the list, the stats and this room's detail query at once.
      await queryClient.invalidateQueries({ queryKey: unitsQueryKey })
      toast.success(`Room ${unit.room_number} was deleted.`)
      setError(null)
      onOpenChange(false)
      onDeleted?.()
    },
    onError: (err) => {
      setError(
        getApiErrorMessage(err, "We couldn't delete this unit. Try again.")
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
      title={`Delete room ${unit.room_number}?`}
      description="This permanently removes the room, its photos and its rate from the property. This action is not reversible."
      confirmLabel="Delete unit"
      pendingLabel="Deleting"
      destructive
      isPending={mutation.isPending}
      error={error}
      onConfirm={() => mutation.mutate()}
    />
  )
}

export { DeleteUnitDialog }
