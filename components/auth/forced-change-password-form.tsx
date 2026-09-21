"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader, Info } from "lucide-react"
import { useForm } from "react-hook-form"
import toast from "react-hot-toast"
import { ChangePasswordFields } from "@/components/auth/change-password-fields"
import { Button } from "@/components/ui/button"
import { useLogout } from "@/hooks/use-logout"
import { changePassword } from "@/lib/api/auth"
import { getApiErrorMessage } from "@/lib/api/errors"
import {
  changePasswordSchema,
  type ChangePasswordValues,
} from "@/lib/schemas/auth"
import { useAuth } from "@/providers/auth-provider"

function ForcedChangePasswordForm() {
  const router = useRouter()
  const { status, user, refreshUser } = useAuth()
  const { isLoggingOut, logout } = useLogout()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({
    mode: "onTouched",
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", password: "", confirmPassword: "" },
  })

  // Only accounts that actually need a new password belong here.
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login")
    else if (status === "authenticated" && user && !user.must_change_password) {
      router.replace("/dashboard")
    }
  }, [status, user, router])

  if (status !== "authenticated" || !user?.must_change_password) return null

  async function onSubmit(values: ChangePasswordValues) {
    try {
      await changePassword(values.currentPassword, values.password)
      await refreshUser()
      toast.success("Your password has been updated. Welcome aboard!")
      router.replace("/dashboard")
    } catch (error) {
      setError("root", {
        message: getApiErrorMessage(
          error,
          "We couldn't update your password. Try again."
        ),
      })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <fieldset
        disabled={isSubmitting || isLoggingOut}
        className="grid gap-4"
      >
        <p
          role="status"
          className="flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 px-3.5 py-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200"
        >
          <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <span>
            Hi {user.full_name.split(" ")[0]}. For security, you need to replace
            the temporary password you were given before using the dashboard.
          </span>
        </p>

        <ChangePasswordFields
          register={register}
          errors={errors}
          currentPasswordLabel="Temporary password"
        />

        <Button
          type="submit"
          className="mt-2 h-13 w-full rounded-full bg-brand-azure text-base font-semibold text-white hover:bg-brand-azure/90 focus-visible:ring-brand-azure/30"
        >
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <Loader size={22} className="animate-spin" color="#ffffff" />
              <span>Saving</span>
            </span>
          ) : (
            "Save and continue"
          )}
        </Button>

        <button
          type="button"
          onClick={logout}
          className="mx-auto rounded-sm text-sm font-semibold text-brand-azure underline-offset-4 outline-none hover:underline focus-visible:underline focus-visible:ring-3 focus-visible:ring-brand-azure/20 disabled:opacity-60"
        >
          {isLoggingOut ? "Signing out" : "Not you? Sign out"}
        </button>
      </fieldset>
    </form>
  )
}

export { ForcedChangePasswordForm }
