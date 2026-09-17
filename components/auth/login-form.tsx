"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader } from "lucide-react"
import { useForm } from "react-hook-form"
import { AuthField, AuthInput } from "@/components/auth/auth-field"
import { PasswordInput } from "@/components/auth/password-input"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/providers/auth-provider"
import { loginSchema, type LoginValues } from "@/lib/schemas/auth"

function LoginForm() {
  const router = useRouter()
  const { login } = useAuth()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  })

  async function onSubmit(values: LoginValues) {
    try {
      // TODO: pass credentials to the sign-in endpoint.
      console.log("login", values)
      await login()
      router.replace("/dashboard")
    } catch {
      setError("root", {
        message: "We couldn't sign you in. Check your details and try again.",
      })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <fieldset disabled={isSubmitting} className="grid min-w-0 gap-4">
        <AuthField
          label="Username"
          htmlFor="username"
          error={errors.username?.message}
        >
          <AuthInput
            id="username"
            autoComplete="username"
            autoFocus
            placeholder="John Kamau"
            aria-invalid={Boolean(errors.username)}
            aria-describedby={errors.username ? "username-error" : undefined}
            {...register("username")}
          />
        </AuthField>

        <AuthField
          label="Password"
          htmlFor="password"
          error={errors.password?.message}
        >
          <PasswordInput
            id="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
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
          className="mt-2 h-13 w-full rounded-full bg-brand-azure text-base font-semibold text-white hover:bg-brand-azure/90 focus-visible:ring-brand-azure/30"
        >
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <Loader size={22} className="animate-spin" color="#ffffff" />
              <span>Signing in</span>
            </span>
          ) : (
            "Log In"
          )}
        </Button>

        <Link
          href="/forgot-password"
          className="mx-auto rounded-sm text-sm font-semibold text-brand-azure underline-offset-4 outline-none hover:underline focus-visible:underline focus-visible:ring-3 focus-visible:ring-brand-azure/20"
        >
          Forgot password?
        </Link>
      </fieldset>
    </form>
  )
}

export { LoginForm }
