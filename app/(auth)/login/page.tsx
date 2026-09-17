import { type Metadata } from "next"
import { AuthPanel } from "@/components/auth/auth-panel"
import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "Sign in",
}

export default function LoginPage() {
  return (
    <AuthPanel
      title="Welcome back"
      description="Sign in to your account to continue"
    >
      <LoginForm />
    </AuthPanel>
  )
}
