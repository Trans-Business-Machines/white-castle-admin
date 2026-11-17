"use client"

import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader } from "lucide-react"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RoleMultiSelect } from "@/components/users/role-multiselect"
import { getApiErrorMessage } from "@/lib/api/errors"
import { fetchRoles, rolesQueryKey } from "@/lib/api/roles"
import { updateUser, usersQueryKey } from "@/lib/api/users"
import type { AuthUser } from "@/lib/types"

interface Props {
  user: AuthUser
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Lets a manager add or remove roles from an account. */
export function EditUserRolesDialog({ user, open, onOpenChange }: Props) {
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<string[]>([])

  const roles = useQuery({
    queryKey: rolesQueryKey,
    queryFn: fetchRoles,
    enabled: open,
  })

  // Start from the account's current roles every time the dialog opens.
  useEffect(() => {
    if (open) {
      const current = user.roles?.length ? user.roles : [user.role]
      setSelected(current)
    }
  }, [open, user.roles, user.role])

  const mutation = useMutation({
    mutationFn: (roles: string[]) =>
      updateUser(user.user_id, { roles, role: roles[0] }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: usersQueryKey })
      toast.success(`${user.full_name}'s roles were updated.`)
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, "We couldn't update this user's roles.")
      )
    },
  })

  function save() {
    if (selected.length === 0) return
    mutation.mutate(selected)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!mutation.isPending) onOpenChange(next)
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Edit {user.full_name}&apos;s roles
          </DialogTitle>
          <DialogDescription>
            Access is the union of every role selected here. Changes take effect
            the next time this user signs in or refreshes their session.
          </DialogDescription>
        </DialogHeader>

        {roles.isPending ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Loading roles…
          </p>
        ) : roles.isError ? (
          <p className="flex items-center justify-center gap-2 py-6 text-sm text-destructive">
            We couldn&apos;t load roles.
            <button
              type="button"
              onClick={() => roles.refetch()}
              className="font-semibold underline underline-offset-4"
            >
              Retry
            </button>
          </p>
        ) : (
          <RoleMultiSelect
            roles={roles.data ?? []}
            value={selected}
            onChange={setSelected}
            disabled={mutation.isPending}
            idPrefix="edit-user-role"
          />
        )}

        {selected.length === 0 ? (
          <p className="text-sm text-destructive">
            Keep at least one role on the account.
          </p>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-full px-5"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={save}
            disabled={
              mutation.isPending ||
              roles.isPending ||
              roles.isError ||
              selected.length === 0
            }
            className="h-11 rounded-full bg-brand-azure px-5 text-white hover:bg-brand-azure/90 focus-visible:ring-brand-azure/30"
          >
            {mutation.isPending ? (
              <span className="inline-flex items-center gap-2">
                <Loader aria-hidden="true" className="animate-spin" />
                Saving
              </span>
            ) : (
              "Save roles"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
