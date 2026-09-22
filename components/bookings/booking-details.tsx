"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { cn } from "cn"
import {
  ArrowLeft,
  BedDouble,
  CalendarCheck,
  CalendarX,
  Clock,
  Mail,
  NotebookPen,
  Phone,
  QrCode,
  UserRound,
  Users,
  Wallet,
} from "lucide-react"
import { BookingActionsMenu } from "@/components/bookings/booking-actions-menu"
import {
  BookingStatusBadge,
  PaymentStatusBadge,
} from "@/components/bookings/booking-status-badge"
import { getGuestHref } from "@/components/guests/guest-actions-menu"
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
import { getUnitHref } from "@/components/units/unit-actions-menu"
import { bookingQueryKey, fetchBookingDetails } from "@/lib/api/bookings"
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/api/errors"
import { fetchUnits, unitsQueryKey } from "@/lib/api/units"
import { formatCurrency, formatDate, formatTimestamp } from "@/lib/format"
import type { Booking } from "@/lib/types"
import { getRoomTypeLabel } from "@/lib/units"

/** "2 adults, 1 child" / "1 adult, 0 children". */
function formatOccupants(adults: number, children: number) {
  return `${adults} ${adults === 1 ? "adult" : "adults"}, ${children} ${children === 1 ? "child" : "children"}`
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

function BackToBookings() {
  return (
    <Button
      asChild
      variant="ghost"
      size="sm"
      className="-ml-2 w-fit text-muted-foreground hover:text-foreground"
    >
      <Link href="/bookings">
        <ArrowLeft aria-hidden="true" />
        All bookings
      </Link>
    </Button>
  )
}

function BookingDetailsSkeleton() {
  return (
    <div className="grid gap-6" aria-busy="true" aria-label="Loading booking">
      <BackToBookings />
      <Card className="border-iron/30 shadow-md">
        <CardContent className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-8 w-64 rounded" />
            <Skeleton className="h-5 w-40 rounded-full" />
          </div>
          <Skeleton className="size-9 rounded-full" />
        </CardContent>
      </Card>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
        {Array.from({ length: 4 }, (_, card) => (
          <Card key={card} className="border-iron shadow-md">
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-9 w-20 rounded" />
              <Skeleton className="h-4 w-16 rounded" />
            </CardContent>
          </Card>
        ))}
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

/** A booking's full record: stay, guest, payment, QR code and audit trail. */
function BookingDetails({ bookingId }: { bookingId: string }) {
  const query = useQuery({
    queryKey: bookingQueryKey(bookingId),
    queryFn: () => fetchBookingDetails(bookingId),
    // A missing booking won't appear on retry, so don't keep hammering the API.
    retry: (count, error) => getApiErrorStatus(error) !== 404 && count < 2,
  })

  // Bookings only carry `room_id`; the units list gives the number and type.
  const units = useQuery({ queryKey: unitsQueryKey, queryFn: fetchUnits })

  if (query.isPending) return <BookingDetailsSkeleton />

  if (query.isError) {
    const notFound = getApiErrorStatus(query.error) === 404
    return (
      <div className="grid gap-6">
        <BackToBookings />
        <Card className="border-iron/30 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-bold">
              {notFound ? "Booking not found" : "We couldn't load this booking"}
            </CardTitle>
            <CardDescription>
              {notFound
                ? "This booking may have been removed or the link is out of date."
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

  const booking: Booking = query.data
  const room = units.data?.find((unit) => unit.room_id === booking.room_id)
  const status = booking.status.toLowerCase()
  const closureReason =
    status === "rejected"
      ? booking.rejection_reason
      : status === "cancelled"
        ? booking.cancellation_reason
        : null

  return (
    <div className="grid gap-6">
      <BackToBookings />

      {/* Reference card with status pills and the actions menu */}
      <Card className="border-iron/30 shadow-md">
        <CardContent className="flex flex-row flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-ibm-plex text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Booking
            </p>
            <h2 className="font-mono text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              {booking.reference}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <BookingStatusBadge status={booking.status} />
              <PaymentStatusBadge status={booking.payment_status} />
              <span>
                {formatDate(booking.check_in_date)} to{" "}
                {formatDate(booking.check_out_date)}
              </span>
            </div>
          </div>

          {/* A pending booking is still a request, so it gets the
              approve / reject decisions here too. */}
          <BookingActionsMenu
            booking={booking}
            showView={false}
            variant={status === "pending" ? "request" : "booking"}
          />
        </CardContent>
      </Card>

      {status === "rejected" || status === "cancelled" ? (
        <p
          role="status"
          className="flex items-start gap-3 rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
        >
          <CalendarX aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <span className="grid gap-1">
            <span className="font-semibold">
              This booking was {status}
              {booking.cancelled_at && status === "cancelled"
                ? ` on ${formatTimestamp(booking.cancelled_at)}`
                : ""}
              .
            </span>
            <span>
              {closureReason?.trim()
                ? `Reason: ${closureReason.trim()}`
                : "No reason was recorded."}
            </span>
          </span>
        </p>
      ) : null}

      {/* Headline figures */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
        <StatCard
          title="Total"
          titleClassName="text-emerald-700 dark:text-emerald-300"
          text={formatCurrency(booking.total_amount)}
          label="For the whole stay"
        />
        <StatCard
          title="Deposit"
          titleClassName="text-amber-700 dark:text-amber-300"
          text={formatCurrency(booking.deposit_amount)}
          label="Due to confirm"
        />
        <StatCard
          title="Nights"
          titleClassName="text-brand-navy dark:text-sky-200"
          text={String(booking.nights)}
          label={`${formatDate(booking.check_in_date, "d MMM")} – ${formatDate(booking.check_out_date, "d MMM")}`}
        />
        <StatCard
          title="Guests"
          titleClassName="text-violet-700 dark:text-violet-300"
          text={String(booking.adults + booking.children)}
          label={formatOccupants(booking.adults, booking.children)}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-iron/30 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Stay</CardTitle>
            <CardDescription>Room and dates for this booking.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-5">
              <DetailItem
                icon={BedDouble}
                label="Room"
                value={
                  room ? (
                    <Link
                      href={getUnitHref(room.room_id)}
                      className="underline-offset-4 hover:underline"
                    >
                      Room {room.room_number}
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        {getRoomTypeLabel(room.room_type)}
                      </span>
                    </Link>
                  ) : units.isPending ? (
                    <Skeleton className="h-5 w-24 rounded" />
                  ) : (
                    "—"
                  )
                }
              />
              <DetailItem
                icon={CalendarCheck}
                label="Check-in"
                value={formatDate(booking.check_in_date, "EEEE, d MMM yyyy")}
              />
              <DetailItem
                icon={CalendarX}
                label="Check-out"
                value={formatDate(booking.check_out_date, "EEEE, d MMM yyyy")}
              />
              <DetailItem
                icon={Users}
                label="Occupants"
                value={formatOccupants(booking.adults, booking.children)}
              />
              <DetailItem
                icon={NotebookPen}
                label="Special requests"
                value={
                  booking.special_requests?.trim() ? (
                    <span className="whitespace-pre-line">
                      {booking.special_requests.trim()}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">None</span>
                  )
                }
              />
            </dl>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card className="border-iron/30 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Guest</CardTitle>
              <CardDescription>Who the booking is for.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-5">
                <DetailItem
                  icon={UserRound}
                  label="Name"
                  value={
                    booking.guest_id ? (
                      <Link
                        href={getGuestHref(booking.guest_id)}
                        className="underline-offset-4 hover:underline"
                      >
                        {booking.guest_name}
                      </Link>
                    ) : (
                      booking.guest_name
                    )
                  }
                />
                <DetailItem
                  icon={Mail}
                  label="Email"
                  value={
                    booking.guest_email ? (
                      <a
                        href={`mailto:${booking.guest_email}`}
                        className="underline-offset-4 hover:underline"
                      >
                        {booking.guest_email}
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
                    booking.guest_phone ? (
                      <a
                        href={`tel:${booking.guest_phone.replace(/[^\d+]/g, "")}`}
                        className="underline-offset-4 hover:underline"
                      >
                        {booking.guest_phone}
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
              <CardTitle className="text-lg font-bold">Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-5 sm:grid-cols-2">
                <DetailItem
                  icon={Wallet}
                  label="Status"
                  value={<PaymentStatusBadge status={booking.payment_status} />}
                />
                <DetailItem
                  icon={Clock}
                  label="Payment deadline"
                  value={formatTimestamp(booking.payment_deadline)}
                />
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
        <Card className="border-iron/30 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Timeline</CardTitle>
            <CardDescription>
              When each step of this booking happened.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-5 sm:grid-cols-2">
              <DetailItem
                label="Created"
                value={formatTimestamp(booking.created_at)}
              />
              <DetailItem
                label="Approved"
                value={
                  <>
                    {formatTimestamp(booking.approved_at)}
                    {booking.approved_by ? (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        by {booking.approved_by}
                      </span>
                    ) : null}
                  </>
                }
              />
              <DetailItem
                label="Checked in"
                value={formatTimestamp(booking.check_in_at)}
              />
              <DetailItem
                label="Checked out"
                value={formatTimestamp(booking.check_out_at)}
              />
              <DetailItem
                label="Cancelled"
                value={
                  <>
                    {formatTimestamp(booking.cancelled_at)}
                    {booking.cancelled_by ? (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        by {booking.cancelled_by}
                      </span>
                    ) : null}
                  </>
                }
              />
              <DetailItem
                label="Last updated"
                value={formatTimestamp(booking.updated_at)}
              />
            </dl>
          </CardContent>
        </Card>

        <Card className="border-iron/30 shadow-md lg:w-64">
          <CardHeader>
            <CardTitle className="text-lg font-bold">QR code</CardTitle>
            <CardDescription>Scan at check-in.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3">
            {booking.qr_code ? (
              // A data URI from the API; next/image gains nothing here.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={booking.qr_code}
                alt={`QR code for booking ${booking.reference}`}
                className="size-40 rounded-md bg-white p-2 ring-1 ring-foreground/10"
              />
            ) : (
              <span className="flex size-40 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <QrCode aria-hidden="true" className="size-10" />
              </span>
            )}
            <span className="font-mono text-xs text-muted-foreground">
              {booking.reference}
            </span>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export { BookingDetails }
