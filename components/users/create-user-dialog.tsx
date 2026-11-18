"use client"

import { useState, type PropsWithChildren } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Info, Loader } from "lucide-react"
import {
  Controller,
  useForm,
  useWatch,
  type DefaultValues,
} from "react-hook-form"
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
import { RoleMultiSelect } from "@/components/users/role-multiselect"
import {
  FieldError,
  TemporaryPasswordField,
  inputClassName,
  labelClassName,
} from "@/components/users/temporary-password-field"
import { getApiErrorMessage } from "@/lib/api/errors"
import { fetchRoles, rolesQueryKey } from "@/lib/api/roles"
import { createUser, usersQueryKey } from "@/lib/api/users"
import { generatePassword } from "@/lib/password"
import { hasPermission } from "@/lib/roles"
import { useAuth } from "@/providers/auth-provider"
import {
  createUserSchema,
  toCreateUserPayload,
  type CreateUserValues,
} from "@/lib/schemas/users"

const emptyValues: DefaultValues<CreateUserValues> = {
  email: "",
  roles: [],
  password: "",
}

export function CreateUserDialog({ children }: PropsWithChildren) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const canGrantSuperAdmin = hasPermission(user?.permissions, "system:full")

  const {
    control,
    register,
    handleSubmit,
    setError,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: emptyValues,
  })

  const password = useWatch({ control, name: "password" })

  // Roles are only requested while the dialog is open.
  const roles = useQuery({
    queryKey: rolesQueryKey,
    queryFn: fetchRoles,
    enabled: open,
  })

  const mutation = useMutation({
    mutationFn: (values: CreateUserValues) =>
      createUser(toCreateUserPayload(values)),
    onSuccess: async (user) => {
      await queryClient.invalidateQueries({ queryKey: usersQueryKey })
      toast.success(`Account for ${user.full_name || user.email} created.`)
      closeDialog()
    },
    onError: (error) => {
      setError("root", {
        message: getApiErrorMessage(
          error,
          "We couldn't create the account. Try again."
        ),
      })
    },
  })

  /**
   * Wipes the form and local state, then closes. This deliberately skips
   * the pending guard below: TanStack runs `onSuccess` before it flips
   * `isPending` off, so a guarded close would silently no-op after a
   * successful save.
   */
  function closeDialog() {
    reset(emptyValues)
    mutation.reset()
    setOpen(false)
  }

  function handleOpenChange(next: boolean) {
    // Ignore Escape / backdrop clicks while a request is in flight.
    if (mutation.isPending) return
    if (next) {
      reset({ ...emptyValues, roles: [], password: generatePassword() })
      setOpen(true)
    } else {
      closeDialog()
    }
  }

  function regeneratePassword() {
    setValue("password", generatePassword(), { shouldValidate: true })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Create new user
          </DialogTitle>
          <DialogDescription>
            Add a staff member and give them a role.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-3 rounded-lg border border-brand-azure/20 bg-brand-azure/10 px-4 py-3">
          <Info
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-brand-azure"
          />
          <p className="text-sm text-brand-navy dark:text-foreground">
            Share the temporary password with the new user. They&apos;ll be
            asked to choose their own the first time they sign in.
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
              <Label htmlFor="user-email" className={labelClassName}>
                Email
              </Label>
              <Input
                id="user-email"
                type="email"
                autoFocus
                autoComplete="off"
                placeholder="reservations@eldoretwhitecastle.com"
                className={inputClassName}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={
                  errors.email ? "user-email-error" : undefined
                }
                {...register("email")}
              />
              <FieldError
                id="user-email-error"
                message={errors.email?.message}
              />
              <p className="text-xs text-muted-foreground">
                The account signs in with this address. Add the people who use
                it under Operators once it exists.
              </p>
            </div>

            <div className="grid gap-2">
              <Label className={labelClassName}>Roles</Label>
              <Controller
                control={control}
                name="roles"
                render={({ field }) => (
                  <RoleMultiSelect
                    roles={(roles.data ?? []).filter(
                      (role) =>
                        canGrantSuperAdmin || role.name !== "super_admin"
                    )}
                    value={field.value ?? []}
                    onChange={field.onChange}
                    disabled={
                      roles.isPending || roles.isError || mutation.isPending
                    }
                    idPrefix="new-user-role"
                  />
                )}
              />
              {roles.isError ? (
                <p className="flex items-center gap-2 text-sm text-destructive">
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
                <FieldError
                  id="user-role-error"
                  message={errors.roles?.message}
                />
              )}
              <p className="text-xs text-muted-foreground">
                Pick every role this person needs. Access is the union of those
                roles&apos; permissions.
              </p>
            </div>

            <TemporaryPasswordField
              id="user-password"
              label="Temporary password"
              value={password}
              registration={register("password")}
              error={errors.password?.message}
              onRegenerate={regeneratePassword}
            />

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
                    Creating
                  </span>
                ) : (
                  "Create user"
                )}
              </Button>
            </DialogFooter>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
  )
}
