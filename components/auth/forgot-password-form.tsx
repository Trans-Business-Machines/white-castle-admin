"use client"

import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { AuthField, AuthInput } from "@/components/auth/auth-field"
import { Button } from "@/components/ui/button"
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "@/lib/schemas/auth"
import { Loader } from "lucide-react"

function ForgotPasswordForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  })

  async function onSubmit(values: ForgotPasswordValues) {
    // TODO: request a reset link from the auth endpoint.
    console.log("forgot-password", values)
    return new Promise((resolve) => {
      setTimeout(resolve, 1500)
    })
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
          aria-describedby={errors.email ? "username-error" : undefined}
          {...register("email")}
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
