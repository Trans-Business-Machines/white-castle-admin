"use client"

import { Controller, useWatch, type UseFormReturn } from "react-hook-form"
import { DateOfBirthPicker } from "@/components/guests/date-of-birth-picker"
import { NationalityCombobox } from "@/components/guests/nationality-combobox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  getIdNumberLabel,
  ID_TYPES,
  type GuestValues,
} from "@/lib/schemas/guests"

const labelClassName =
  "font-heading text-xs font-semibold tracking-wide text-iron uppercase"
const inputClassName =
  "h-11 rounded-lg border-border bg-canvas px-3.5 text-base focus-visible:border-brand-azure focus-visible:ring-brand-azure/20 md:text-base dark:bg-input/30"

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  )
}

interface GuestFormFieldsProps {
  form: UseFormReturn<GuestValues>
  /** Disables the popover pickers while a request is in flight. */
  pending: boolean
}

/**
 * Every guest input, shared by the add and edit dialogs. The owning dialog
 * holds the form and the mutation and wraps these in its own `<fieldset>`.
 */
export function GuestFormFields({ form, pending }: GuestFormFieldsProps) {
  const {
    control,
    register,
    formState: { errors },
  } = form
  const idType = useWatch({ control, name: "id_type" })

  return (
    <>
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
          aria-describedby={errors.email ? "guest-email-error" : undefined}
          {...register("email")}
        />
        <FieldError id="guest-email-error" message={errors.email?.message} />
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
          aria-describedby={errors.phone ? "guest-phone-error" : undefined}
          {...register("phone")}
        />
        <FieldError id="guest-phone-error" message={errors.phone?.message} />
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
              disabled={pending}
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
              disabled={pending}
              invalid={Boolean(errors.date_of_birth)}
              describedBy={
                errors.date_of_birth ? "guest-date-of-birth-error" : undefined
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
    </>
  )
}
