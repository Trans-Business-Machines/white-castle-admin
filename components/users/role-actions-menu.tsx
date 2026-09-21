"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { EllipsisVertical, Trash2 } from "lucide-react"
import toast from "react-hot-toast"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getApiErrorMessage } from "@/lib/api/errors"
import { deleteRole, rolesQueryKey } from "@/lib/api/roles"
import { usersQueryKey } from "@/lib/api/users"
import type { Role } from "@/lib/types"

function RoleActionsMenu({ role }: { role: Role }) {
  const queryClient = useQueryClient()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => deleteRole(role.name),
    onSuccess: async () => {
      // Users resolve role labels from the roles query, so refresh both.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: rolesQueryKey }),
        queryClient.invalidateQueries({ queryKey: usersQueryKey }),
      ])
      toast.success(`The ${role.label} role was deleted.`)
      closeConfirm()
    },
    onError: (err) => {
      setError(
        getApiErrorMessage(err, "We couldn't delete this role. Try again.")
      )
    },
  })

  function openConfirm() {
    setError(null)
    mutation.reset()
    setConfirming(true)
  }

  /** Clears the error and unmounts the confirm dialog. */
  function closeConfirm() {
    setError(null)
    setConfirming(false)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${role.label}`}
            className="rounded-full text-muted-foreground hover:text-foreground data-open:bg-muted"
          >
            <EllipsisVertical aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem variant="destructive" onSelect={openConfirm}>
            <Trash2 aria-hidden="true" />
            Delete role
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {confirming ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open) closeConfirm()
          }}
          title="Delete this role?"
          description={`This permanently removes the ${role.label} role (${role.name}). This can't be undone, and users still assigned to it may lose access.`}
          confirmLabel="Delete role"
          pendingLabel="Deleting"
          destructive
          isPending={mutation.isPending}
          error={error}
          onConfirm={() => mutation.mutate()}
        />
      ) : null}
    </>
  )
}

export { RoleActionsMenu }
