"use client"

import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { AuthField } from "@/components/auth/auth-field"
import { PasswordInput } from "@/components/auth/password-input"
import { Button } from "@/components/ui/button"
import {
  resetPasswordSchema,
  type ResetPasswordValues,
} from "@/lib/schemas/auth"
import { Loader } from "lucide-react"

function ResetPasswordForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  })

  async function onSubmit(values: ResetPasswordValues) {
    // TODO: submit the new password along with the reset token from the URL.
    console.log("reset-password", values)
    console.log("forgot-password", values)
    return new Promise((resolve) => {
      setTimeout(resolve, 1500)
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
      <AuthField
        label="New password"
        htmlFor="password"
        error={errors.password?.message}
      >
        <PasswordInput
          id="password"
          placeholder="Enter your new password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "password-error" : undefined}
          {...register("password")}
        />
      </AuthField>

      <AuthField
        label="Confirm password"
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

      <Button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 h-13 w-full rounded-full bg-brand-azure text-base font-semibold text-white hover:bg-brand-azure/90 focus-visible:ring-brand-azure/30"
      >
        {isSubmitting ? (
          <span className="inline-flex items-center gap-2">
            <Loader size={22} className="animate-spin" color="#ffffff" />
            <span>Saving</span>
          </span>
        ) : (
          "Save new password"
        )}
      </Button>

      <Link
        href="/login"
        className="mx-auto rounded-sm text-sm font-semibold text-brand-azure underline-offset-4 outline-none hover:underline focus-visible:underline focus-visible:ring-3 focus-visible:ring-brand-azure/20"
      >
        Back to sign in
      </Link>
    </form>
  )
}

export { ResetPasswordForm }
