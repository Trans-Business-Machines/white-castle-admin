import { type Metadata } from "next"

import { AuthPanel } from "@/components/auth/auth-panel"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export const metadata: Metadata = {
  title: "Forgot password",
}

export default function ForgotPasswordPage() {
  return (
    <AuthPanel
      title="Forgot password"
      description="We'll send a reset link to the email on file for your account."
    >
      <ForgotPasswordForm />
    </AuthPanel>
  )
}
