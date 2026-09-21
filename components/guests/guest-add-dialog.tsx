"use client"

import { useState, type PropsWithChildren } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader } from "lucide-react"
import { Controller, useForm, useWatch } from "react-hook-form"
import toast from "react-hot-toast"
import { DateOfBirthPicker } from "@/components/guests/date-of-birth-picker"
import { NationalityCombobox } from "@/components/guests/nationality-combobox"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { getApiErrorMessage } from "@/lib/api/errors"
import { createGuest, guestsQueryKey } from "@/lib/api/guests"
import {
  DEFAULT_ID_TYPE,
  getIdNumberLabel,
  guestSchema,
  ID_TYPES,
  toGuestPayload,
  type GuestValues,
} from "@/lib/schemas/guests"

const labelClassName =
  "font-ibm-plex text-xs font-semibold tracking-wide text-iron uppercase"
const inputClassName =
  "h-11 rounded-lg border-border bg-canvas px-3.5 text-base focus-visible:border-brand-azure focus-visible:ring-brand-azure/20 md:text-base dark:bg-input/30"

const emptyValues: GuestValues = {
  full_name: "",
  email: "",
  phone: "",
  id_type: DEFAULT_ID_TYPE,
  national_id: "",
  nationality: "",
  date_of_birth: null,
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  )
}

export function NewGuestDialog({ children }: PropsWithChildren) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const {
    control,
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<GuestValues>({
    resolver: zodResolver(guestSchema),
    defaultValues: emptyValues,
  })

  const idType = useWatch({ control, name: "id_type" })

  const mutation = useMutation({
    mutationFn: (values: GuestValues) => createGuest(toGuestPayload(values)),
    onSuccess: async (guest) => {
      await queryClient.invalidateQueries({ queryKey: guestsQueryKey })
      toast.success(`${guest.full_name} added as a guest.`)
      closeDialog()
    },
    onError: (error) => {
      setError("root", {
        message: getApiErrorMessage(
          error,
          "We couldn't save the guest. Try again."
        ),
      })
    },
  })

  function closeDialog() {
    reset(emptyValues)
    mutation.reset()
    setOpen(false)
  }

  function handleOpenChange(next: boolean) {
    // Ignore Escape / backdrop clicks while a request is in flight.
    if (mutation.isPending) return
    if (next) {
      setOpen(true)
    } else {
      closeDialog()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-bold">
            Add guest
          </DialogTitle>
          <DialogDescription>
            Guest records are reused for walk-ins and future bookings.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          noValidate
        >
          <fieldset
            disabled={mutation.isPending}
            className="grid min-w-0 gap-4"
          >
            {/* Full name */}
            <div className="grid gap-2">
              <Label htmlFor="guest-full-name" className={labelClassName}>
                Full name
              </Label>
              <Input
                id="guest-full-name"
                autoFocus
                autoComplete="off"
                placeholder="Jane Doe"
                className={inputClassName}
                aria-invalid={Boolean(errors.full_name)}
                aria-describedby={
                  errors.full_name ? "guest-full-name-error" : undefined
                }
                {...register("full_name")}
              />
              <FieldError
                id="guest-full-name-error"
                message={errors.full_name?.message}
              />
            </div>

            {/* Email */}
            <div className="grid gap-2">
              <Label htmlFor="guest-email" className={labelClassName}>
                Email
              </Label>
              <Input
                id="guest-email"
                type="email"
                autoComplete="off"
                placeholder="jane@gmail.com"
                className={inputClassName}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={
                  errors.email ? "guest-email-error" : undefined
                }
                {...register("email")}
              />
              <FieldError
                id="guest-email-error"
                message={errors.email?.message}
              />
            </div>

            {/* Phone */}
            <div className="grid gap-2">
              <Label htmlFor="guest-phone" className={labelClassName}>
                Phone
              </Label>
              <Input
                id="guest-phone"
                type="tel"
                autoComplete="off"
                placeholder="+254 712 345 678"
                className={inputClassName}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={
                  errors.phone ? "guest-phone-error" : undefined
                }
                {...register("phone")}
              />
              <FieldError
                id="guest-phone-error"
                message={errors.phone?.message}
              />
            </div>

            {/* ID type */}
            <div className="grid gap-2">
              <Label id="guest-id-type-label" className={labelClassName}>
                ID type
              </Label>
              <Controller
                control={control}
                name="id_type"
                render={({ field }) => (
                  <RadioGroup
                    ref={field.ref}
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    aria-labelledby="guest-id-type-label"
                    aria-invalid={Boolean(errors.id_type)}
                    aria-describedby={
                      errors.id_type ? "guest-id-type-error" : undefined
                    }
                    className="flex flex-wrap gap-x-6 gap-y-3"
                  >
                    {ID_TYPES.map((type) => (
                      <div key={type.value} className="flex items-center gap-2">
                        <RadioGroupItem
                          id={`guest-id-type-${type.value}`}
                          value={type.value}
                          className="data-checked:border-brand-azure data-checked:bg-brand-azure dark:data-checked:bg-brand-azure"
                        />
                        <Label
                          htmlFor={`guest-id-type-${type.value}`}
                          className="text-base font-normal"
                        >
                          {type.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
              />
              <FieldError
                id="guest-id-type-error"
                message={errors.id_type?.message}
              />
            </div>

            {/* ID number */}
            <div className="grid gap-2">
              <Label htmlFor="guest-national-id" className={labelClassName}>
                {getIdNumberLabel(idType)}
              </Label>
              <Input
                id="guest-national-id"
                autoComplete="off"
                spellCheck={false}
                placeholder={idType === "passport" ? "A1234567" : "12345678"}
                className={inputClassName}
                aria-invalid={Boolean(errors.national_id)}
                aria-describedby={
                  errors.national_id ? "guest-national-id-error" : undefined
                }
                {...register("national_id")}
              />
              <FieldError
                id="guest-national-id-error"
                message={errors.national_id?.message}
              />
            </div>

            {/* Nationality */}
            <div className="grid gap-2">
              <Label htmlFor="guest-nationality" className={labelClassName}>
                Nationality
              </Label>
              <Controller
                control={control}
                name="nationality"
                render={({ field }) => (
                  <NationalityCombobox
                    id="guest-nationality"
                    ref={field.ref}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    disabled={mutation.isPending}
                    invalid={Boolean(errors.nationality)}
                    describedBy={
                      errors.nationality ? "guest-nationality-error" : undefined
                    }
                    className={inputClassName}
                  />
                )}
              />
              <FieldError
                id="guest-nationality-error"
                message={errors.nationality?.message}
              />
            </div>

            {/* Date of birth */}
            <div className="grid gap-2">
              <Label htmlFor="guest-date-of-birth" className={labelClassName}>
                Date of birth
              </Label>
              <Controller
                control={control}
                name="date_of_birth"
                render={({ field }) => (
                  <DateOfBirthPicker
                    id="guest-date-of-birth"
                    ref={field.ref}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    disabled={mutation.isPending}
                    invalid={Boolean(errors.date_of_birth)}
                    describedBy={
                      errors.date_of_birth
                        ? "guest-date-of-birth-error"
                        : undefined
                    }
                    className={inputClassName}
                  />
                )}
              />
              <FieldError
                id="guest-date-of-birth-error"
                message={errors.date_of_birth?.message}
              />
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
                  "Add guest"
                )}
              </Button>
            </DialogFooter>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
  )
}
