"use client"

import { useState, type PropsWithChildren } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader } from "lucide-react"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PermissionPicker } from "@/components/users/permission-picker"
import { getApiErrorMessage } from "@/lib/api/errors"
import {
  createRole,
  fetchPermissions,
  permissionsQueryKey,
  rolesQueryKey,
  updateRolePermissions,
} from "@/lib/api/roles"
import { roleSlug } from "@/lib/roles"

interface Props extends PropsWithChildren {
  /** Called after creation so the caller can open the permission editor. */
  onCreated?: () => void
}

/** Creates a custom role and lets the manager pick its permission bundle. */
export function CreateRoleDialog({ children, onCreated }: Props) {
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [nameTouched, setNameTouched] = useState(false)
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const queryClient = useQueryClient()

  const permissions = useQuery({
    queryKey: permissionsQueryKey,
    queryFn: fetchPermissions,
    enabled: open,
  })

  const mutation = useMutation({
    mutationFn: async () => {
      const role = await createRole({
        name: roleSlug(name || label),
        label: label.trim(),
        description: description.trim() || undefined,
      })
      if (selectedPermissions.length > 0) {
        await updateRolePermissions(role.name, selectedPermissions)
      }
      return role
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: rolesQueryKey })
      toast.success(
        selectedPermissions.length > 0
          ? `${label.trim()} role created with ${selectedPermissions.length} permissions.`
          : `${label.trim()} role created. You can add permissions any time.`
      )
      reset()
      setOpen(false)
      onCreated?.()
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "We couldn't create this role."))
    },
  })

  function reset() {
    setLabel("")
    setName("")
    setDescription("")
    setNameTouched(false)
    setSelectedPermissions([])
    mutation.reset()
  }

  function handleOpenChange(next: boolean) {
    if (mutation.isPending) return
    if (!next) reset()
    setOpen(next)
  }

  const slug = roleSlug(name || label)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Create role</DialogTitle>
          <DialogDescription>
            Give the role a clear name, then choose its permissions. You can
            change both later.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="role-label">Display name</Label>
            <Input
              id="role-label"
              value={label}
              autoFocus
              placeholder="Night Manager"
              className="h-11"
              onChange={(event) => {
                setLabel(event.target.value)
                if (!nameTouched) setName(roleSlug(event.target.value))
              }}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="role-name">Role key</Label>
            <Input
              id="role-name"
              value={name}
              placeholder="night_manager"
              className="h-11 font-mono text-sm"
              onChange={(event) => {
                setNameTouched(true)
                setName(roleSlug(event.target.value))
              }}
            />
            <p className="text-xs text-muted-foreground">
              Used by the API. Lowercase letters, numbers and underscores.
              {slug ? ` Saves as “${slug}”.` : ""}
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="role-description">Description</Label>
            <Input
              id="role-description"
              value={description}
              placeholder="What this role is responsible for"
              className="h-11"
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label>Permissions</Label>
            {permissions.isError ? (
              <p className="flex items-center gap-2 text-sm text-destructive">
                We couldn&apos;t load permissions.
                <button
                  type="button"
                  onClick={() => permissions.refetch()}
                  className="font-semibold underline underline-offset-4"
                >
                  Retry
                </button>
              </p>
            ) : (
              <PermissionPicker
                permissions={permissions.data ?? []}
                selected={selectedPermissions}
                onChange={setSelectedPermissions}
                disabled={mutation.isPending}
                loading={permissions.isPending}
              />
            )}
            <p className="text-xs text-muted-foreground">
              Pick every capability this role needs. You can change the bundle
              later from the Roles table.
            </p>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-full px-5"
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !label.trim() || !slug}
              className="h-11 rounded-full bg-brand-azure px-5 text-white hover:bg-brand-azure/90 focus-visible:ring-brand-azure/30"
            >
              {mutation.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <Loader aria-hidden="true" className="animate-spin" />
                  Creating
                </span>
              ) : (
                "Create role"
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
