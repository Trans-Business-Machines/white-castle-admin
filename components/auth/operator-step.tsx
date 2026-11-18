"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader } from "lucide-react"
import { AuthField, AuthInput } from "@/components/auth/auth-field"
import { PasswordInput } from "@/components/auth/password-input"
import { Button } from "@/components/ui/button"
import { changeOperatorPin } from "@/lib/api/auth"
import { getApiErrorMessage } from "@/lib/api/errors"
import type { AuthUser } from "@/lib/types"
import { getLandingPath, useAuth } from "@/providers/auth-provider"

const submitClassName =
  "mt-2 h-13 w-full rounded-full bg-brand-azure text-base font-semibold text-white hover:bg-brand-azure/90 focus-visible:ring-brand-azure/30"

/**
 * Second sign-in step for shared role accounts. The account password was
 * already accepted; here the person identifies themselves with their own
 * username and PIN so the audit log names them.
 */
export function OperatorStep({
  challenge,
  account,
  onBack,
}: {
  challenge: string
  account: string
  onBack: () => void
}) {
  const router = useRouter()
  const { completeOperatorLogin } = useAuth()
  const [stage, setStage] = useState<"identify" | "pin">("identify")
  const [username, setUsername] = useState("")
  const [pin, setPin] = useState("")
  const [user, setUser] = useState<AuthUser | null>(null)
  const [newPin, setNewPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function identify(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    if (!username.trim()) {
      setError("Enter your operator username.")
      return
    }
    if (!/^\d{4,8}$/.test(pin)) {
      setError("Enter your 4 to 8 digit PIN.")
      return
    }
    setBusy(true)
    try {
      const result = await completeOperatorLogin(
        challenge,
        username.trim().toLowerCase(),
        pin
      )
      if (result.mustChangePin) {
        setUser(result.user)
        setStage("pin")
      } else {
        router.replace(getLandingPath(result.user))
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "We couldn't verify your PIN."))
    } finally {
      setBusy(false)
    }
  }

  async function savePin(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    if (!/^\d{4,8}$/.test(newPin)) {
      setError("Your new PIN must be 4 to 8 digits.")
      return
    }
    if (newPin !== confirmPin) {
      setError("The PINs don't match.")
      return
    }
    setBusy(true)
    try {
      await changeOperatorPin(pin, newPin)
      if (user) router.replace(getLandingPath(user))
    } catch (err) {
      setError(getApiErrorMessage(err, "We couldn't update your PIN."))
    } finally {
      setBusy(false)
    }
  }

  if (stage === "pin") {
    return (
      <form onSubmit={savePin} noValidate>
        <p className="mb-4 text-sm text-muted-foreground">
          Choose a new PIN. It replaces the temporary one you just used.
        </p>
        <fieldset disabled={busy} className="grid min-w-0 gap-4">
          <AuthField label="New PIN" htmlFor="new-pin">
            <PasswordInput
              id="new-pin"
              inputMode="numeric"
              autoComplete="new-password"
              placeholder="4 to 8 digits"
              value={newPin}
              onChange={(event) => setNewPin(event.target.value)}
            />
          </AuthField>
          <AuthField label="Confirm PIN" htmlFor="confirm-pin">
            <PasswordInput
              id="confirm-pin"
              inputMode="numeric"
              autoComplete="new-password"
              placeholder="Repeat the PIN"
              value={confirmPin}
              onChange={(event) => setConfirmPin(event.target.value)}
            />
          </AuthField>
          {error ? (
            <p role="alert" className="rounded-md bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <Button type="submit" className={submitClassName}>
            {busy ? (
              <span className="inline-flex items-center gap-2">
                <Loader size={22} className="animate-spin" color="#ffffff" />
                <span>Saving</span>
              </span>
            ) : (
              "Save PIN and continue"
            )}
          </Button>
        </fieldset>
      </form>
    )
  }

  return (
    <form onSubmit={identify} noValidate>
      <p className="mb-4 text-sm text-muted-foreground">
        Signing in to <strong className="text-foreground">{account}</strong>.
        Enter your own username and PIN so the activity is recorded against you.
      </p>
      <fieldset disabled={busy} className="grid min-w-0 gap-4">
        <AuthField label="Operator username" htmlFor="operator-username">
          <AuthInput
            id="operator-username"
            autoComplete="username"
            autoFocus
            placeholder="e.g. mary"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </AuthField>
        <AuthField label="PIN" htmlFor="operator-pin">
          <PasswordInput
            id="operator-pin"
            inputMode="numeric"
            autoComplete="current-password"
            placeholder="4 to 8 digits"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
          />
        </AuthField>
        {error ? (
          <p role="alert" className="rounded-md bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <Button type="submit" className={submitClassName}>
          {busy ? (
            <span className="inline-flex items-center gap-2">
              <Loader size={22} className="animate-spin" color="#ffffff" />
              <span>Checking</span>
            </span>
          ) : (
            "Continue"
          )}
        </Button>
        <button
          type="button"
          onClick={onBack}
          className="mx-auto rounded-sm text-sm font-semibold text-brand-azure underline-offset-4 outline-none hover:underline focus-visible:underline"
        >
          Use a different account
        </button>
      </fieldset>
    </form>
  )
}
