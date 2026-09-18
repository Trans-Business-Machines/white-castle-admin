import { Suspense } from "react"
import { type Metadata } from "next"

import { AuthPanel } from "@/components/auth/auth-panel"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"

export const metadata: Metadata = {
  title: "Reset password",
}

export default function ResetPasswordPage() {
  return (
    <AuthPanel
      title="Reset password"
      description="Choose a new password for your White Castle admin account."
    >
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </AuthPanel>
  )
}
