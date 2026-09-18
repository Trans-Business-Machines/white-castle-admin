"use client"

import type { FieldErrors, UseFormRegister } from "react-hook-form"
import { AuthField } from "@/components/auth/auth-field"
import { PasswordInput } from "@/components/auth/password-input"
import type { ChangePasswordValues } from "@/lib/schemas/auth"

interface ChangePasswordFieldsProps {
  register: UseFormRegister<ChangePasswordValues>
  errors: FieldErrors<ChangePasswordValues>
  /** Label for the first field; "Temporary password" on the forced screen. */
  currentPasswordLabel?: string
}

function ChangePasswordFields({
  register,
  errors,
  currentPasswordLabel = "Current password",
}: ChangePasswordFieldsProps) {
  return (
    <>
      <AuthField
        label={currentPasswordLabel}
        htmlFor="currentPassword"
        error={errors.currentPassword?.message}
      >
        <PasswordInput
          id="currentPassword"
          autoComplete="current-password"
          autoFocus
          placeholder={`Enter your ${currentPasswordLabel.toLowerCase()}`}
          aria-invalid={Boolean(errors.currentPassword)}
          aria-describedby={
            errors.currentPassword ? "currentPassword-error" : undefined
          }
          {...register("currentPassword")}
        />
      </AuthField>

      <AuthField
        label="New password"
        htmlFor="password"
        error={errors.password?.message}
      >
        <PasswordInput
          id="password"
          autoComplete="new-password"
          placeholder="Enter your new password"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "password-error" : undefined}
          {...register("password")}
        />
      </AuthField>

      <AuthField
        label="Confirm new password"
        htmlFor="confirmPassword"
        error={errors.confirmPassword?.message}
      >
        <PasswordInput
          id="confirmPassword"
          autoComplete="new-password"
          placeholder="Re-enter your new password"
          aria-invalid={Boolean(errors.confirmPassword)}
          aria-describedby={
            errors.confirmPassword ? "confirmPassword-error" : undefined
          }
          {...register("confirmPassword")}
        />
      </AuthField>

      {errors.root ? (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
        >
          {errors.root.message}
        </p>
      ) : null}
    </>
  )
}

export { ChangePasswordFields }
