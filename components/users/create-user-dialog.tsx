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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import {
  createUserSchema,
  toCreateUserPayload,
  type CreateUserValues,
} from "@/lib/schemas/users"

// `role` stays unset until one is picked, so the Select shows its placeholder.
const emptyValues: DefaultValues<CreateUserValues> = {
  full_name: "",
  username: "",
  email: "",
  password: "",
}

export function CreateUserDialog({ children }: PropsWithChildren) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

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
      toast.success(`Account for ${user.full_name} created.`)
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
      reset({ ...emptyValues, password: generatePassword() })
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

      <DialogContent className="max-h-[90vh] overflow-y-auto md:max-w-2xl">
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
              <Label htmlFor="user-full-name" className={labelClassName}>
                Full name
              </Label>
              <Input
                id="user-full-name"
                autoFocus
                autoComplete="off"
                placeholder="John Doe"
                className={inputClassName}
                aria-invalid={Boolean(errors.full_name)}
                aria-describedby={
                  errors.full_name ? "user-full-name-error" : undefined
                }
                {...register("full_name")}
              />
              <FieldError
                id="user-full-name-error"
                message={errors.full_name?.message}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="user-username" className={labelClassName}>
                  Username
                </Label>
                <Input
                  id="user-username"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="John"
                  className={inputClassName}
                  aria-invalid={Boolean(errors.username)}
                  aria-describedby={
                    errors.username ? "user-username-error" : undefined
                  }
                  {...register("username")}
                />
                <FieldError
                  id="user-username-error"
                  message={errors.username?.message}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="user-email" className={labelClassName}>
                  Email
                </Label>
                <Input
                  id="user-email"
                  type="email"
                  autoComplete="off"
                  placeholder="john@gmail.com"
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
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="user-role" className={labelClassName}>
                Role
              </Label>
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    disabled={roles.isPending || roles.isError}
                  >
                    <SelectTrigger
                      id="user-role"
                      ref={field.ref}
                      onBlur={field.onBlur}
                      className={`${inputClassName} w-full data-[size=default]:h-11`}
                      aria-invalid={Boolean(errors.role)}
                      aria-describedby={
                        errors.role ? "user-role-error" : undefined
                      }
                    >
                      <SelectValue
                        placeholder={
                          roles.isPending ? "Loading roles…" : "Choose a role"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.data?.map((role) => (
                        <SelectItem key={role.name} value={role.name}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  message={errors.role?.message}
                />
              )}
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
