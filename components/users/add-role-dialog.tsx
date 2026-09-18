"use client"

import { useState, type PropsWithChildren } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Info, Loader } from "lucide-react"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createRole, rolesQueryKey } from "@/lib/api/roles"
import { getApiErrorMessage } from "@/lib/api/errors"
import { roleSchema, toRolePayload, type RoleValues } from "@/lib/schemas/roles"

const labelClassName =
  "font-ibm-plex text-xs font-semibold tracking-wide text-iron uppercase"
const inputClassName =
  "h-11 rounded-lg border-border bg-canvas px-3.5 text-base focus-visible:border-brand-azure focus-visible:ring-brand-azure/20 md:text-base dark:bg-input/30"

export function NewRoleDialog({ children }: PropsWithChildren) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<RoleValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: { name: "", description: "" },
  })

  const mutation = useMutation({
    mutationFn: (values: RoleValues) => createRole(toRolePayload(values)),
    onSuccess: (role) => {
      queryClient.invalidateQueries({ queryKey: rolesQueryKey })
      toast.success(`Role "${role.label}" added.`)
      handleOpenChange(false)
    },
    onError: (error) => {
      setError("root", {
        message: getApiErrorMessage(
          error,
          "We couldn't save the role. Try again."
        ),
      })
    },
  })

  function handleOpenChange(next: boolean) {
    if (mutation.isPending) return
    setOpen(next)
    if (!next) {
      reset()
      mutation.reset()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Add role</DialogTitle>
          <DialogDescription>Define a new level of access.</DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-3 rounded-lg border border-brand-azure/20 bg-brand-azure/10 px-4 py-3">
          <Info
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-brand-azure"
          />
          <p className="text-sm text-brand-navy dark:text-foreground">
            Roles decide what staff can see and do. Add the role here first,
            then assign it to people in the Create user dialog.
          </p>
        </div>

        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          noValidate
        >
          <fieldset
            disabled={mutation.isPending}
            className="grid min-w-0 gap-4"
          >
            <div className="grid gap-2">
              <Label htmlFor="role-name" className={labelClassName}>
                Name
              </Label>
              <Input
                id="role-name"
                autoFocus
                autoComplete="off"
                placeholder="Admin"
                className={inputClassName}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "role-name-error" : undefined}
                {...register("name")}
              />
              {errors.name ? (
                <p id="role-name-error" className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role-description" className={labelClassName}>
                Description
              </Label>
              <Textarea
                id="role-description"
                rows={3}
                placeholder="Hotel manager. Full operations access, manages staff accounts."
                className={`${inputClassName} h-auto min-h-24 py-2.5`}
                aria-invalid={Boolean(errors.description)}
                aria-describedby={
                  errors.description ? "role-description-error" : undefined
                }
                {...register("description")}
              />
              {errors.description ? (
                <p
                  id="role-description-error"
                  className="text-sm text-destructive"
                >
                  {errors.description.message}
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
                className="h-11 rounded-full bg-brand-azure px-5 text-white hover:bg-brand-azure/90 focus-visible:ring-brand-azure/30"
              >
                {mutation.isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader aria-hidden="true" className="animate-spin" />
                    Saving
                  </span>
                ) : (
                  "Save role"
                )}
              </Button>
            </DialogFooter>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
  )
}
