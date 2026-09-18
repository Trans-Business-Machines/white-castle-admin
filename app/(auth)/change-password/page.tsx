import { type Metadata } from "next"
import { AuthPanel } from "@/components/auth/auth-panel"
import { ForcedChangePasswordForm } from "@/components/auth/forced-change-password-form"

export const metadata: Metadata = {
  title: "Set a new password",
}

export default function ChangePasswordPage() {
  return (
    <AuthPanel
      title="Set a new password"
      description="Your account is using a temporary password. Choose your own to continue."
    >
      <ForcedChangePasswordForm />
    </AuthPanel>
  )
}
