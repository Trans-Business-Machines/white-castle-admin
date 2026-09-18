"use client"

import { Loader, LogOut, ShieldAlert } from "lucide-react"
import { ChangePasswordDialog } from "@/components/profile/change-password-dialog"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useLogout } from "@/hooks/use-logout"
import { formatDate, getInitials } from "@/lib/format"
import { useAuth } from "@/providers/auth-provider"

function formatTimestamp(value: string | null | undefined) {
  if (!value) return "—"
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? "—"
    : formatDate(date, "eeee, dd MMM yyyy, hh:mm a")
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <dt className="font-ibm-plex text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="truncate text-base font-medium text-foreground">
        {value}
      </dd>
    </div>
  )
}

function ProfileView() {
  const { user } = useAuth()
  const { isLoggingOut, logout } = useLogout()

  if (!user) return null

  return (
    <div className="grid gap-6">
      {user.must_change_password ? (
        <p
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          <ShieldAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <span>
            Your account is using a temporary password. Change it now to keep
            your account secure.
          </span>
        </p>
      ) : null}

      <Card className="border-iron/30 shadow-md">
        <CardContent className="gap-6">
          <div className="flex flex-wrap items-center gap-4">
            <span
              aria-hidden="true"
              className="flex size-16 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-brand-navy via-brand-azure to-brand-teal font-heading text-xl font-bold text-white"
            >
              {getInitials(user.full_name)}
            </span>
            <div className="min-w-0">
              <h2 className="truncate font-heading text-2xl font-bold tracking-tight text-foreground">
                {user.full_name}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-brand-azure/10 px-2.5 py-0.5 text-xs font-semibold text-brand-azure capitalize">
                  {user.role}
                </span>
                <span
                  className={
                    user.active
                      ? "rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800"
                      : "rounded-full bg-neutral-200 px-2.5 py-0.5 text-xs font-semibold text-neutral-700"
                  }
                >
                  {user.active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          <dl className="grid gap-5 sm:grid-cols-2">
            <DetailItem label="Username" value={user.username} />
            <DetailItem label="Email" value={user.email} />
            <DetailItem
              label="Last sign in"
              value={formatTimestamp(user.last_login_at)}
            />
            <DetailItem
              label="Member since"
              value={formatTimestamp(user.created_at)}
            />
          </dl>
        </CardContent>
      </Card>

      <Card className="border-iron/30 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Account</CardTitle>
          <CardDescription>
            Manage your password and end your session on this device.
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-0">
          <div className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div className="min-w-0">
              <p className="font-medium text-foreground">Password</p>
              <p className="text-sm text-muted-foreground">
                Choose a strong password you don&apos;t use anywhere else.
              </p>
            </div>
            <ChangePasswordDialog />
          </div>

          <Separator />

          <div className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div className="min-w-0">
              <p className="font-medium text-foreground">Sign out</p>
              <p className="text-sm text-muted-foreground">
                You&apos;ll need your username and password to sign back in.
              </p>
            </div>
            <Button
              type="button"
              variant="destructive"
              className="h-11 rounded-full px-5"
              disabled={isLoggingOut}
              onClick={logout}
            >
              {isLoggingOut ? (
                <Loader aria-hidden="true" className="animate-spin" />
              ) : (
                <LogOut aria-hidden="true" />
              )}
              {isLoggingOut ? "Signing out" : "Sign out"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export { ProfileView }
