"use client"

import { Controller, useWatch, type UseFormReturn } from "react-hook-form"
import { DateOfBirthPicker } from "@/components/guests/date-of-birth-picker"
import { NationalityCombobox } from "@/components/guests/nationality-combobox"
import { PhotoDropzone } from "@/components/units/photo-dropzone"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  getIdDocumentError,
  getIdDocumentLabel,
  getIdNumberLabel,
  ID_DOCUMENT_TYPES,
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
  /**
   * Locks the details once the guest itself is saved, so a retry only
   * repeats the ID document upload.
   */
  detailsLocked?: boolean
}

/**
 * Every guest input, shared by the add and edit dialogs. The owning dialog
 * holds the form and the mutation and wraps these in its own `<fieldset>`.
 */
export function GuestFormFields({
  form,
  pending,
  detailsLocked = false,
}: GuestFormFieldsProps) {
  const {
    control,
    register,
    setError,
    clearErrors,
    formState: { errors },
  } = form
  const idType = useWatch({ control, name: "id_type" })

  return (
    <>
      <fieldset disabled={detailsLocked} className="grid min-w-0 gap-4">
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
      </fieldset>

      {/* ID document — uploaded after the guest is saved, so it stays
          editable while a failed upload is retried. */}
      <div className="grid gap-2">
        <Label htmlFor="guest-id-document" className={labelClassName}>
          {getIdDocumentLabel(idType)}{" "}
          <span className="font-normal text-muted-foreground normal-case">
            (optional)
          </span>
        </Label>
        <Controller
          control={control}
          name="id_document"
          render={({ field }) => (
            <PhotoDropzone
              id="guest-id-document"
              value={field.value}
              remaining={1 - field.value.length}
              disabled={pending}
              invalid={Boolean(errors.id_document)}
              describedBy={
                errors.id_document ? "guest-id-document-error" : undefined
              }
              accept={ID_DOCUMENT_TYPES}
              validate={getIdDocumentError}
              hint="PNG or JPG up to 10 MB, or a PDF up to 5 MB"
              fullMessage="One file is attached. Remove it to pick another."
              overflowMessage={(count) =>
                `Only one file can be attached, so ${count} ${
                  count === 1 ? "file was" : "files were"
                } left out.`
              }
              onChange={(files) => {
                clearErrors("id_document")
                field.onChange(files)
              }}
              onReject={(message) => setError("id_document", { message })}
            />
          )}
        />
        <FieldError
          id="guest-id-document-error"
          message={errors.id_document?.message}
        />
      </div>
    </>
  )
}
