"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  EllipsisVertical,
  Trash2,
  UserRoundCheck,
  UserRoundX,
} from "lucide-react"
import toast from "react-hot-toast"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getApiErrorMessage } from "@/lib/api/errors"
import {
  deleteUser,
  disableUser,
  enableUser,
  usersQueryKey,
} from "@/lib/api/users"
import type { AuthUser } from "@/lib/types"
import { useAuth } from "@/providers/auth-provider"

type UserAction = "enable" | "disable" | "delete"

const actionCopy: Record<
  UserAction,
  {
    title: string
    description: (user: AuthUser) => string
    confirmLabel: string
    pendingLabel: string
    successMessage: (user: AuthUser) => string
    failureMessage: string
    destructive: boolean
  }
> = {
  enable: {
    title: "Enable this user?",
    description: (user) =>
      `${user.full_name} will be able to sign in and use the dashboard again.`,
    confirmLabel: "Enable user",
    pendingLabel: "Enabling",
    successMessage: (user) => `${user.full_name} can sign in again.`,
    failureMessage: "We couldn't enable this user. Try again.",
    destructive: false,
  },
  disable: {
    title: "Disable this user?",
    description: (user) =>
      `${user.full_name} will be signed out and won't be able to sign in until the account is enabled again. Their records are kept.`,
    confirmLabel: "Disable user",
    pendingLabel: "Disabling",
    successMessage: (user) => `${user.full_name} has been disabled.`,
    failureMessage: "We couldn't disable this user. Try again.",
    destructive: false,
  },
  delete: {
    title: "Delete this user?",
    description: (user) =>
      `This permanently removes ${user.full_name}'s account (${user.username}). This can't be undone. If they might return, disable the account instead.`,
    confirmLabel: "Delete user",
    pendingLabel: "Deleting",
    successMessage: (user) => `${user.full_name}'s account was deleted.`,
    failureMessage: "We couldn't delete this user. Try again.",
    destructive: true,
  },
}

const actionRequest: Record<UserAction, (userId: string) => Promise<unknown>> =
  {
    enable: enableUser,
    disable: disableUser,
    delete: deleteUser,
  }

function UserActionsMenu({ user }: { user: AuthUser }) {
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()
  const [action, setAction] = useState<UserAction | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isSelf = currentUser?.user_id === user.user_id

  const mutation = useMutation({
    mutationFn: (pending: UserAction) => actionRequest[pending](user.user_id),
    onSuccess: (_, pending) => {
      queryClient.invalidateQueries({ queryKey: usersQueryKey })
      toast.success(actionCopy[pending].successMessage(user))
      setAction(null)
    },
    onError: (err, pending) => {
      setError(getApiErrorMessage(err, actionCopy[pending].failureMessage))
    },
  })

  function openConfirm(next: UserAction) {
    setError(null)
    mutation.reset()
    setAction(next)
  }

  const copy = action ? actionCopy[action] : null

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${user.full_name}`}
            className="rounded-full text-muted-foreground hover:text-foreground data-open:bg-muted"
          >
            <EllipsisVertical aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            disabled={user.active}
            onSelect={() => openConfirm("enable")}
          >
            <UserRoundCheck aria-hidden="true" />
            Enable user
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!user.active || isSelf}
            onSelect={() => openConfirm("disable")}
          >
            <UserRoundX aria-hidden="true" />
            Disable user
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            disabled={isSelf}
            onSelect={() => openConfirm("delete")}
          >
            <Trash2 aria-hidden="true" />
            Delete user
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {action && copy ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open) setAction(null)
          }}
          title={copy.title}
          description={copy.description(user)}
          confirmLabel={copy.confirmLabel}
          pendingLabel={copy.pendingLabel}
          destructive={copy.destructive}
          isPending={mutation.isPending}
          error={error}
          onConfirm={() => mutation.mutate(action)}
        />
      ) : null}
    </>
  )
}

export { UserActionsMenu }
