"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  EllipsisVertical,
  LockOpen,
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
  unlockUser,
  usersQueryKey,
} from "@/lib/api/users"
import { isSuperAdmin } from "@/lib/roles"
import type { AuthUser } from "@/lib/types"
import { useAuth } from "@/providers/auth-provider"

type UserAction = "enable" | "disable" | "unlock" | "delete"

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
  unlock: {
    title: "Unlock this account?",
    description: (user) =>
      `${user.full_name}'s account was locked after too many failed sign-in attempts. Unlocking lets them try signing in again straight away.`,
    confirmLabel: "Unlock account",
    pendingLabel: "Unlocking",
    successMessage: (user) =>
      `${user.full_name}'s account is unlocked. They can sign in again.`,
    failureMessage: "We couldn't unlock this account. Try again.",
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
    unlock: unlockUser,
    delete: deleteUser,
  }

function UserActionsMenu({ user }: { user: AuthUser }) {
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()
  const [action, setAction] = useState<UserAction | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isSelf = currentUser?.user_id === user.user_id
  const actorIsSuperAdmin = isSuperAdmin(currentUser?.role)
  // Only a super admin may delete accounts; everyone else doesn't see the item.
  const canDelete = actorIsSuperAdmin
  // A super admin sits above admins, so only another super admin may
  // disable their account.
  const outranked = isSuperAdmin(user.role) && !actorIsSuperAdmin

  const mutation = useMutation({
    mutationFn: (pending: UserAction) => actionRequest[pending](user.user_id),
    onSuccess: async (_, pending) => {
      await queryClient.invalidateQueries({ queryKey: usersQueryKey })
      toast.success(actionCopy[pending].successMessage(user))
      closeConfirm()
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

  /** Clears the error and unmounts the confirm dialog. */
  function closeConfirm() {
    setError(null)
    setAction(null)
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
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem
            disabled={user.active}
            onSelect={() => openConfirm("enable")}
          >
            <UserRoundCheck aria-hidden="true" />
            Enable user
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!user.active || isSelf || outranked}
            onSelect={() => openConfirm("disable")}
          >
            <UserRoundX aria-hidden="true" />
            Disable user
          </DropdownMenuItem>
          {/* Accounts lock after 5 failed sign-ins; any admin may unlock one. */}
          {user.is_locked ? (
            <DropdownMenuItem onSelect={() => openConfirm("unlock")}>
              <LockOpen aria-hidden="true" />
              Unlock account
            </DropdownMenuItem>
          ) : null}
          {canDelete ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                disabled={isSelf}
                onSelect={() => openConfirm("delete")}
              >
                <Trash2 aria-hidden="true" />
                Delete user
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {action && copy ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open) closeConfirm()
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
