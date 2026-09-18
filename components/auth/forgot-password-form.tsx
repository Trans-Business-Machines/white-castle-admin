"use client"

import { useState } from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader, MailCheck } from "lucide-react"
import { useForm } from "react-hook-form"
import { AuthField, AuthInput } from "@/components/auth/auth-field"
import { Button } from "@/components/ui/button"
import { requestPasswordReset } from "@/lib/api/auth"
import { getApiErrorMessage } from "@/lib/api/errors"
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "@/lib/schemas/auth"

function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  })

  async function onSubmit(values: ForgotPasswordValues) {
    try {
      await requestPasswordReset(values.email)
      setSentTo(values.email)
    } catch (error) {
      setError("root", {
        message: getApiErrorMessage(
          error,
          "We couldn't send a reset link. Try again."
        ),
      })
    }
  }

  if (sentTo) {
    return (
      <div className="grid gap-4">
        <p
          role="status"
          className="flex items-start gap-3 rounded-md bg-brand-azure/10 px-3.5 py-3 text-sm text-foreground"
        >
          <MailCheck
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-brand-azure"
          />
          <span>
            If an account exists for <strong>{sentTo}</strong>, a reset link is
            on its way. Check your inbox and spam folder.
          </span>
        </p>
        <Link
          href="/login"
          className="mx-auto rounded-sm text-sm font-semibold text-brand-azure underline-offset-4 outline-none hover:underline focus-visible:underline focus-visible:ring-3 focus-visible:ring-brand-azure/20"
        >
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
      <AuthField
        label="Email Address"
        htmlFor="email"
        error={errors.email?.message}
      >
        <AuthInput
          id="email"
          autoComplete="email"
          placeholder="example@gmail.com"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
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
        disabled={isSubmitting}
        className="mt-2 h-13 w-full rounded-full bg-brand-azure text-base font-semibold text-white hover:bg-brand-azure/90 focus-visible:ring-brand-azure/30"
      >
        {isSubmitting ? (
          <span className="inline-flex items-center gap-2">
            <Loader size={22} className="animate-spin" color="#ffffff" />
            <span>Sending</span>
          </span>
        ) : (
          "Send reset link"
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

export { ForgotPasswordForm }
