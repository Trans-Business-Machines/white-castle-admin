"use client"

import { useQuery } from "@tanstack/react-query"
import { Mail, Phone, ShieldAlert } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getApiErrorMessage } from "@/lib/api/errors"
import { fetchGuestDetails } from "@/lib/api/guests"
import type { Guest } from "@/lib/types"

interface Props {
  guest: Pick<Guest, "guest_id" | "full_name">
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Shows a guest's unmasked contact details. Opening the dialog calls the
 * backend with `reveal=true`, which writes a `GUEST_PII_REVEALED` audit row.
 */
export function RevealGuestPiiDialog({ guest, open, onOpenChange }: Props) {
  const query = useQuery({
    queryKey: ["guests", guest.guest_id, "pii"],
    queryFn: () => fetchGuestDetails(guest.guest_id, true),
    enabled: open,
    staleTime: 0,
    gcTime: 0,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {guest.full_name}&apos;s contact details
          </DialogTitle>
          <DialogDescription className="flex items-start gap-2">
            <ShieldAlert
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0"
            />
            <span>
              Revealing guest PII is recorded in the audit log against your
              account.
            </span>
          </DialogDescription>
        </DialogHeader>

        {query.isPending ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Revealing details…
          </p>
        ) : query.isError ? (
          <p className="py-6 text-center text-sm text-destructive">
            {getApiErrorMessage(
              query.error,
              "We couldn't reveal these details."
            )}
          </p>
        ) : (
          <dl className="grid gap-4">
            <div className="grid gap-1">
              <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Email
              </dt>
              <dd className="flex items-center gap-2 text-base text-foreground">
                <Mail
                  aria-hidden="true"
                  className="size-4 text-muted-foreground"
                />
                {query.data.email || "—"}
              </dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Phone
              </dt>
              <dd className="flex items-center gap-2 font-mono text-base text-foreground">
                <Phone
                  aria-hidden="true"
                  className="size-4 text-muted-foreground"
                />
                {query.data.phone || "—"}
              </dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                ID number
              </dt>
              <dd className="font-mono text-base text-foreground">
                {query.data.national_id || "—"}
              </dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Date of birth
              </dt>
              <dd className="text-base text-foreground">
                {query.data.date_of_birth || "—"}
              </dd>
            </div>
          </dl>
        )}
      </DialogContent>
    </Dialog>
  )
}
