"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { CircleCheck, Loader } from "lucide-react"
import { useForm } from "react-hook-form"
import { AuthField } from "@/components/auth/auth-field"
import { PasswordInput } from "@/components/auth/password-input"
import { Button } from "@/components/ui/button"
import { confirmPasswordReset } from "@/lib/api/auth"
import { getApiErrorMessage } from "@/lib/api/errors"
import {
  resetPasswordSchema,
  type ResetPasswordValues,
} from "@/lib/schemas/auth"

const INVALID_LINK_MESSAGE =
  "This reset link is invalid or has expired. Request a new one to continue."

function ResetPasswordForm() {
  const token = useSearchParams().get("token")
  const [done, setDone] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    mode: "onTouched",
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  })

  async function onSubmit(values: ResetPasswordValues) {
    if (!token) {
      setError("root", { message: INVALID_LINK_MESSAGE })
      return
    }
    try {
      await confirmPasswordReset(token, values.password)
      setDone(true)
    } catch (error) {
      setError("root", {
        message: getApiErrorMessage(
          error,
          "We couldn't reset your password. Try again."
        ),
      })
    }
  }

  if (done) {
    return (
      <div className="grid gap-4">
        <p
          role="status"
          className="flex items-start gap-3 rounded-md bg-brand-azure/10 px-3.5 py-3 text-sm text-foreground"
        >
          <CircleCheck
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-brand-azure"
          />
          <span>Your password has been updated. Sign in to continue.</span>
        </p>
        <Button
          asChild
          className="mt-2 h-13 w-full rounded-full bg-brand-azure text-base font-semibold text-white hover:bg-brand-azure/90 focus-visible:ring-brand-azure/30"
        >
          <Link href="/login">Go to sign in</Link>
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
      {!token ? (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
        >
          {INVALID_LINK_MESSAGE}{" "}
          <Link
            href="/forgot-password"
            className="font-semibold underline underline-offset-4"
          >
            Request a new link
          </Link>
        </p>
      ) : null}

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

      {errors.root ? (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
        >
          {errors.root.message}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={isSubmitting || !token}
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
