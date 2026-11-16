"use client"

import { useEffect, useState } from "react"
import { LogOut, Timer } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface SessionTimeoutDialogProps {
  open: boolean
  /** Epoch milliseconds when the session will end if nothing is done. */
  endsAt: number | null
  /** `idle` can be extended; `absolute` cannot. */
  reason: "idle" | "absolute"
  onStay: () => void
  onLogout: () => void
}

export function SessionTimeoutDialog({
  open,
  endsAt,
  reason,
  onStay,
  onLogout,
}: SessionTimeoutDialogProps) {
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    if (!open || !endsAt) return
    const tick = () =>
      setRemaining(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)))
    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [open, endsAt])

  if (!open) return null

  const minutes = Math.floor(remaining / 60)
  const seconds = String(remaining % 60).padStart(2, "0")
  const countdown = `${minutes}:${seconds}`

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent showCloseButton={false} className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Timer aria-hidden="true" className="size-5 text-brand-azure" />
            {reason === "absolute" ? "Session ending" : "Still there?"}
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            {reason === "absolute" ? (
              <>
                Your 12-hour sign-in limit ends in{" "}
                <span className="font-semibold text-foreground tabular-nums">
                  {countdown}
                </span>
                . Sign in again to continue.
              </>
            ) : (
              <>
                You&apos;ll be signed out in{" "}
                <span className="font-semibold text-foreground tabular-nums">
                  {countdown}
                </span>{" "}
                because there has been no activity on this terminal.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onLogout}
            className="h-11 rounded-full px-5"
          >
            <LogOut aria-hidden="true" />
            Sign out
          </Button>
          {reason === "idle" ? (
            <Button
              type="button"
              onClick={onStay}
              className="h-11 rounded-full bg-brand-azure px-5 text-white hover:bg-brand-azure/90"
            >
              Stay signed in
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
