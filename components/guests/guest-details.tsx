"use client"

import { useState } from "react"
import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { cn } from "cn"
import { differenceInYears, isValid, parseISO } from "date-fns"
import {
  ArrowLeft,
  Ban,
  Cake,
  Eye,
  FileImage,
  IdCard,
  Globe,
  Mail,
  Phone,
  ShieldAlert,
  ShieldCheck,
  SquarePen,
} from "lucide-react"
import { FilePreviewDialog } from "@/components/file-preview-dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { BlacklistGuestDialog } from "@/components/guests/blacklist-guest-dialog"
import { BlacklistRecommendDialog } from "@/components/guests/blacklist-recommend-dialog"
import { EditGuestDialog } from "@/components/guests/edit-guest-dialog"
import { GuestBlacklistBadge } from "@/components/guests/guest-blacklist-badge"
import { GuestBookingsTable } from "@/components/guests/guest-bookings-table"
import { StatCard } from "@/components/stat-card"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/api/errors"
import {
  approveBlacklistRecommendation,
  dismissBlacklistRecommendation,
  fetchGuestDetails,
  fetchGuestDocument,
  guestDocumentQueryKey,
  guestQueryKey,
  guestsQueryKey,
} from "@/lib/api/guests"
import { getUrlFileId } from "@/lib/download"
import {
  formatCurrency,
  formatDate,
  formatTimestamp,
  getInitials,
} from "@/lib/format"
import {
  getIdDocumentLabel,
  getIdNumberLabel,
  getIdTypeLabel,
} from "@/lib/schemas/guests"
import { hasPermission } from "@/lib/roles"
import type { Guest } from "@/lib/types"
import { useAuth } from "@/providers/auth-provider"
import toast from "react-hot-toast"

function formatBirthDate(value: string | null) {
  if (!value) return "—"
  const date = parseISO(value)
  if (!isValid(date)) return "—"
  const age = differenceInYears(new Date(), date)
  return `${formatDate(date)} (${age} ${age === 1 ? "year" : "years"})`
}

function DetailItem({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  label: string
  value: React.ReactNode
  mono?: boolean
}) {
  return (
    <div className="flex items-start gap-3">
      {Icon ? (
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-brand-azure/10 text-brand-navy dark:bg-brand-azure/20 dark:text-sky-200">
          <Icon aria-hidden className="size-4" />
        </span>
      ) : null}
      <div className="grid min-w-0 gap-0.5">
        <dt className="font-ibm-plex text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {label}
        </dt>
        <dd
          className={cn(
            "wrap-break-words text-base font-medium text-foreground",
            mono && "font-mono"
          )}
        >
          {value}
        </dd>
      </div>
    </div>
  )
}

/**
 * "View" links for the guest's uploaded ID scans, numbered when there's
 * more than one. Each `id_documents` entry is a URL ending in the file id;
 * `GET /guests/documents/{file_id}` trades it for a signed storage URL,
 * which is what the dialog shows.
 */
function IdDocumentLinks({ guest }: { guest: Guest }) {
  const label = getIdDocumentLabel(guest.id_type)
  const fileIds = (guest.id_documents ?? [])
    .map(getUrlFileId)
    .filter((id): id is string => id !== null)

  if (fileIds.length === 0) return "Not uploaded"

  return (
    <span className="flex flex-wrap gap-x-4 gap-y-1">
      {fileIds.map((fileId, index) => {
        const suffix = fileIds.length > 1 ? ` ${index + 1}` : ""
        return (
          <FilePreviewDialog
            key={fileId}
            triggerLabel={`View${suffix}`}
            triggerAriaLabel={`View ${guest.full_name}'s ${label.toLowerCase()}${suffix}`}
            title={`${label}${suffix}`}
            description={
              <>
                <span className="font-semibold text-foreground">
                  {guest.full_name}
                </span>
                {guest.national_id
                  ? ` · ${getIdTypeLabel(guest.id_type)} ${guest.national_id}`
                  : ""}
              </>
            }
            queryKey={guestDocumentQueryKey(fileId)}
            queryFn={() => fetchGuestDocument(fileId)}
            alt={`${guest.full_name}'s ${label.toLowerCase()}`}
            errorMessage="We couldn't load this ID document. Try again."
          />
        )
      })}
    </span>
  )
}

function BackToGuests() {
  return (
    <Button
      asChild
      variant="ghost"
      size="sm"
      className="-ml-2 w-fit text-muted-foreground hover:text-foreground"
    >
      <Link href="/guests">
        <ArrowLeft aria-hidden="true" />
        All guests
      </Link>
    </Button>
  )
}

function GuestDetailsSkeleton() {
  return (
    <div className="grid gap-6" aria-busy="true" aria-label="Loading guest">
      <BackToGuests />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Skeleton className="size-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 rounded" />
            <Skeleton className="h-5 w-28 rounded-full" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-11 w-32 rounded-md" />
          <Skeleton className="h-11 w-36 rounded-md" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }, (_, card) => (
          <Card key={card} className="border-iron/30 shadow-md">
            <CardHeader>
              <Skeleton className="h-6 w-28 rounded" />
            </CardHeader>
            <CardContent className="grid gap-5">
              {Array.from({ length: 3 }, (_, row) => (
                <div key={row} className="flex items-start gap-3">
                  <Skeleton className="size-8 rounded-md" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-20 rounded" />
                    <Skeleton className="h-5 w-40 rounded" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function GuestDetails({ guestId }: { guestId: string }) {
  const [action, setAction] = useState<
    "edit" | "blacklist" | "recommend" | null
  >(null)
  const [revealed, setRevealed] = useState<Guest | null>(null)
  const [revealing, setRevealing] = useState(false)
  const [recommendDecision, setRecommendDecision] = useState<
    "approve" | "dismiss" | null
  >(null)
  const [recommendError, setRecommendError] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const canViewPii = hasPermission(user?.permissions, "guests:pii:view")
  const canRevealPii = hasPermission(user?.permissions, "guests:pii:reveal")
  const canBlacklist = hasPermission(user?.permissions, "guests:blacklist")
  const canRecommend = hasPermission(
    user?.permissions,
    "guests:blacklist:recommend"
  )

  const query = useQuery({
    queryKey: guestQueryKey(guestId),
    queryFn: () => fetchGuestDetails(guestId),
    retry: (count, error) => getApiErrorStatus(error) !== 404 && count < 2,
  })

  const recommendation = useMutation({
    mutationFn: (decision: "approve" | "dismiss") =>
      decision === "approve"
        ? approveBlacklistRecommendation(guestId)
        : dismissBlacklistRecommendation(guestId),
    onSuccess: async (_, decision) => {
      await queryClient.invalidateQueries({ queryKey: guestsQueryKey })
      setRevealed(null)
      toast.success(
        decision === "approve"
          ? `${query.data?.full_name ?? "The guest"} was blacklisted.`
          : "Blacklist recommendation dismissed."
      )
      setRecommendDecision(null)
      setRecommendError(null)
    },
    onError: (error) => {
      setRecommendError(
        getApiErrorMessage(error, "We couldn't update this recommendation.")
      )
    },
  })

  if (query.isPending) return <GuestDetailsSkeleton />

  if (query.isError) {
    const notFound = getApiErrorStatus(query.error) === 404
    return (
      <div className="grid gap-6">
        <BackToGuests />
        <Card className="border-iron/30 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-bold">
              {notFound ? "Guest not found" : "We couldn't load this guest"}
            </CardTitle>
            <CardDescription>
              {notFound
                ? "This guest record may have been removed or the link is out of date."
                : getApiErrorMessage(query.error, "Something went wrong.")}
            </CardDescription>
          </CardHeader>
          {notFound ? null : (
            <CardContent>
              <Button
                type="button"
                variant="outline"
                className="w-fit"
                onClick={() => query.refetch()}
              >
                Retry
              </Button>
            </CardContent>
          )}
        </Card>
      </div>
    )
  }

  const guest: Guest = revealed ?? query.data

  async function revealPii(): Promise<boolean> {
    if (revealing) return false
    setRevealing(true)
    try {
      const full = await fetchGuestDetails(guestId, true)
      setRevealed(full)
      queryClient.setQueryData(guestQueryKey(guestId), full)
      toast.success("Contact details revealed and logged.")
      return true
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "We couldn't reveal these details.")
      )
      return false
    } finally {
      setRevealing(false)
    }
  }

  async function startEdit() {
    if (guest.pii_masked && !canViewPii) {
      if (!canRevealPii) return
      if (!(await revealPii())) return
    }
    setAction("edit")
  }

  return (
    <div className="grid gap-6">
      <BackToGuests />

      {/* Identity row with the update / blacklist CTAs */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <span
            aria-hidden="true"
            className={cn(
              "flex size-16 shrink-0 items-center justify-center rounded-full font-heading text-xl font-bold text-white",
              guest.blacklisted
                ? "bg-linear-to-br from-rose-700 to-rose-500"
                : "bg-linear-to-br from-brand-navy via-brand-azure to-brand-teal"
            )}
          >
            {getInitials(guest.full_name)}
          </span>
          <div className="min-w-0">
            <h2 className="truncate font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              {guest.full_name}
            </h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {guest.blacklisted ? (
                <GuestBlacklistBadge />
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
                  <ShieldCheck aria-hidden="true" className="size-3" />
                  In good standing
                </span>
              )}
              {guest.nationality ? <span>{guest.nationality}</span> : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {guest.pii_masked && canRevealPii ? (
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-md px-5"
              disabled={revealing}
              onClick={() => void revealPii()}
            >
              <Eye aria-hidden="true" />
              {revealing ? "Revealing…" : "Reveal contact details"}
            </Button>
          ) : null}
          {!guest.pii_masked || canViewPii || canRevealPii ? (
            <Button
              type="button"
              variant="default"
              className="h-11 rounded-md bg-brand-azure px-5"
              onClick={() => void startEdit()}
            >
              <SquarePen aria-hidden="true" />
              Update guest
            </Button>
          ) : null}
          {canRecommend &&
          !guest.blacklisted &&
          !guest.blacklist_recommended ? (
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-md px-5"
              onClick={() => setAction("recommend")}
            >
              <ShieldAlert aria-hidden="true" />
              Recommend blacklist
            </Button>
          ) : null}
          {canBlacklist ? (
            guest.blacklisted ? (
              <Button
                type="button"
                className="h-11 rounded-md bg-emerald-600 px-5 text-white hover:bg-emerald-600/90 focus-visible:ring-emerald-600/30"
                onClick={() => setAction("blacklist")}
              >
                <ShieldCheck aria-hidden="true" />
                Remove from blacklist
              </Button>
            ) : (
              <Button
                type="button"
                variant="destructive"
                className="h-11 rounded-md px-5"
                onClick={() => setAction("blacklist")}
              >
                <Ban aria-hidden="true" />
                Blacklist guest
              </Button>
            )
          ) : null}
        </div>
      </div>

      {guest.blacklist_recommended && !guest.blacklisted ? (
        <div
          role="status"
          className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
        >
          <div className="flex items-start gap-3">
            <ShieldAlert
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0"
            />
            <span className="grid gap-1">
              <span className="font-semibold">
                Blacklist recommended
                {guest.blacklist_recommended_by
                  ? ` by ${guest.blacklist_recommended_by}`
                  : ""}
                .
              </span>
              <span>
                {guest.blacklist_recommendation_reason?.trim()
                  ? `Reason: ${guest.blacklist_recommendation_reason.trim()}`
                  : "No reason was recorded."}
              </span>
            </span>
          </div>
          {canBlacklist ? (
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="rounded-full"
                onClick={() => {
                  setRecommendError(null)
                  setRecommendDecision("approve")
                }}
              >
                Approve
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() => {
                  setRecommendError(null)
                  setRecommendDecision("dismiss")
                }}
              >
                Dismiss
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {guest.blacklisted ? (
        <p
          role="status"
          className="flex items-start gap-3 rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
        >
          <Ban aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <span className="grid gap-1">
            <span className="font-semibold">
              This guest is blacklisted and can&apos;t make new bookings.
            </span>
            <span>
              {guest.blacklist_reason?.trim()
                ? `Reason: ${guest.blacklist_reason.trim()}`
                : "No reason was recorded."}{" "}
              Remove them from the blacklist to allow bookings again.
            </span>
          </span>
        </p>
      ) : null}

      {/* Stay history */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-4">
        <StatCard
          title="Total stays"
          titleClassName="text-brand-navy dark:text-sky-200"
          text={String(guest.total_stays)}
          label={guest.total_stays === 1 ? "completed stay" : "completed stays"}
        />
        {guest.total_spent !== null ? (
          <StatCard
            title="Total spent"
            titleClassName="text-emerald-700 dark:text-emerald-300"
            text={formatCurrency(guest.total_spent)}
            label="across all bookings"
          />
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-iron/30 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Contact</CardTitle>
            <CardDescription>
              {guest.pii_masked
                ? "Contact details are masked. Revealing them is audit-logged."
                : "How to reach this guest."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-5">
              <DetailItem
                icon={Mail}
                label="Email"
                value={
                  guest.email ? (
                    <a
                      href={`mailto:${guest.email}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {guest.email}
                    </a>
                  ) : (
                    "—"
                  )
                }
              />
              <DetailItem
                icon={Phone}
                label="Phone"
                mono
                value={
                  guest.phone ? (
                    <a
                      href={`tel:${guest.phone.replace(/[^\d+]/g, "")}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {guest.phone}
                    </a>
                  ) : (
                    "—"
                  )
                }
              />
            </dl>
          </CardContent>
        </Card>

        <Card className="border-iron/30 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Identity</CardTitle>
            <CardDescription>
              Details taken from the guest&apos;s ID document.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-5">
              <DetailItem
                icon={IdCard}
                label={getIdNumberLabel(guest.id_type)}
                mono
                value={
                  guest.national_id ? (
                    <>
                      {guest.national_id}
                      <span className="ml-2 font-sans text-xs font-normal text-muted-foreground">
                        {getIdTypeLabel(guest.id_type)}
                      </span>
                    </>
                  ) : (
                    "—"
                  )
                }
              />
              <DetailItem
                icon={FileImage}
                label={getIdDocumentLabel(guest.id_type)}
                value={<IdDocumentLinks guest={guest} />}
              />
              <DetailItem
                icon={Globe}
                label="Nationality"
                value={guest.nationality || "—"}
              />
              <DetailItem
                icon={Cake}
                label="Date of birth"
                value={formatBirthDate(guest.date_of_birth)}
              />
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card className="border-iron/30 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Record</CardTitle>
          <CardDescription>
            When {guest.full_name} was added to the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-5 sm:grid-cols-3">
            <DetailItem
              label="Guest since"
              value={formatTimestamp(guest.created_at)}
            />
            <DetailItem
              label="Last updated"
              value={formatTimestamp(guest.updated_at)}
            />
          </dl>
        </CardContent>
      </Card>

      <GuestBookingsTable
        guestId={guest.guest_id}
        guestName={guest.full_name}
      />

      <EditGuestDialog
        guest={guest}
        open={action === "edit"}
        onOpenChange={(open) => setAction(open ? "edit" : null)}
      />
      {canBlacklist ? (
        <BlacklistGuestDialog
          guest={guest}
          open={action === "blacklist"}
          onOpenChange={(open) => setAction(open ? "blacklist" : null)}
        />
      ) : null}
      {canRecommend ? (
        <BlacklistRecommendDialog
          guest={guest}
          open={action === "recommend"}
          onOpenChange={(open) => setAction(open ? "recommend" : null)}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(recommendDecision)}
        onOpenChange={(next) => {
          if (!next && !recommendation.isPending) {
            setRecommendDecision(null)
            setRecommendError(null)
          }
        }}
        title={
          recommendDecision === "approve"
            ? `Blacklist ${guest.full_name}?`
            : "Dismiss this recommendation?"
        }
        description={
          recommendDecision === "approve"
            ? `This confirms the recommendation${
                guest.blacklist_recommendation_reason
                  ? `: "${guest.blacklist_recommendation_reason}"`
                  : ""
              }. ${guest.full_name} won't be able to make new bookings.`
            : `The recommendation will be cleared. ${guest.full_name} stays in good standing.`
        }
        confirmLabel={
          recommendDecision === "approve" ? "Blacklist guest" : "Dismiss"
        }
        pendingLabel={
          recommendDecision === "approve" ? "Blacklisting" : "Dismissing"
        }
        destructive={recommendDecision === "approve"}
        isPending={recommendation.isPending}
        error={recommendError}
        onConfirm={() =>
          recommendDecision && recommendation.mutate(recommendDecision)
        }
      />
    </div>
  )
}

export { GuestDetails }
