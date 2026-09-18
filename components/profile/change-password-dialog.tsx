"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { KeyRound, Loader } from "lucide-react"
import { useForm } from "react-hook-form"
import toast from "react-hot-toast"
import { ChangePasswordFields } from "@/components/auth/change-password-fields"
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
import { changePassword } from "@/lib/api/auth"
import { getApiErrorMessage } from "@/lib/api/errors"
import {
  changePasswordSchema,
  type ChangePasswordValues,
} from "@/lib/schemas/auth"

function ChangePasswordDialog() {
  const [open, setOpen] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({
    mode: "onTouched",
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", password: "", confirmPassword: "" },
  })

  function handleOpenChange(next: boolean) {
    if (isSubmitting) return
    setOpen(next)
    if (!next) reset()
  }

  async function onSubmit(values: ChangePasswordValues) {
    try {
      await changePassword(values.currentPassword, values.password)
      toast.success("Your password has been updated.")
      handleOpenChange(false)
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="h-11 rounded-full bg-brand-azure px-5 text-white hover:bg-brand-azure/90 focus-visible:ring-brand-azure/30">
          <KeyRound aria-hidden="true" />
          Change password
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Change your password
          </DialogTitle>
          <DialogDescription>
            Enter your current password to confirm it&apos;s you, then choose a
            new password. You&apos;ll use the new one the next time you sign in.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <fieldset disabled={isSubmitting} className="grid min-w-0 gap-4">
            <ChangePasswordFields register={register} errors={errors} />

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
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader aria-hidden="true" className="animate-spin" />
                    Saving
                  </span>
                ) : (
                  "Save new password"
                )}
              </Button>
            </DialogFooter>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { ChangePasswordDialog }
