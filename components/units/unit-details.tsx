"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, ImageOff, SquarePen, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { DeleteUnitDialog } from "@/components/units/delete-unit-dialog"
import { EditUnitDialog } from "@/components/units/edit-unit-dialog"
import { UnitStatusBadge } from "@/components/units/unit-status-badge"
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/api/errors"
import { fetchUnitDetails, unitQueryKey } from "@/lib/api/units"
import { formatCurrency, formatDate,humanizeSlug } from "@/lib/format"
import { getRoomTypeLabel } from "@/lib/units"
import type { Unit } from "@/lib/types"

function formatTimestamp(value: string | null | undefined) {
  if (!value) return "—"
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? "—"
    : formatDate(date, "dd MMM yyyy, hh:mm a")
}

function DetailItem({
  label,
  value,
  mono = false,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
}) {
  return (
    <div className="grid gap-1">
      <dt className="font-ibm-plex text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd
        className={
          mono
            ? "font-mono text-base font-medium text-foreground"
            : "text-base font-medium text-foreground"
        }
      >
        {value}
      </dd>
    </div>
  )
}

function BackToUnits() {
  return (
    <Button
      asChild
      variant="ghost"
      size="sm"
      className="-ml-2 w-fit text-muted-foreground hover:text-foreground"
    >
      <Link href="/units">
        <ArrowLeft aria-hidden="true" />
        All units
      </Link>
    </Button>
  )
}

function UnitDetailsSkeleton() {
  return (
    <div className="grid gap-6" aria-busy="true" aria-label="Loading unit">
      <BackToUnits />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40 rounded" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-11 w-28 rounded-md" />
          <Skeleton className="h-11 w-28 rounded-md" />
        </div>
      </div>
      <Card className="border-iron/30 shadow-md">
        <CardContent className="gap-6">
          <Skeleton className="aspect-video w-full rounded-lg" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-3 w-20 rounded" />
                <Skeleton className="h-5 w-32 rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function UnitPhotos({ unit }: { unit: Unit }) {
  const photos = unit.photos ?? []

  if (photos.length === 0) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-canvas text-muted-foreground dark:bg-input/30">
        <ImageOff aria-hidden="true" className="size-6" />
        <p className="text-sm">No photos uploaded for this room yet.</p>
      </div>
    )
  }

  const [cover, ...rest] = photos

  return (
    <div className="grid gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={cover}
        alt={`Room ${unit.room_number}`}
        className="aspect-video w-full rounded-lg object-cover ring-1 ring-foreground/10"
      />
      {rest.length > 0 ? (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
          {rest.map((url, index) => (
            <li key={url}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Room ${unit.room_number}, photo ${index + 2}`}
                className="aspect-4/3 w-full rounded-md object-cover ring-1 ring-foreground/10"
              />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

/** Full details for one room, with the update / delete CTAs at the top right. */
function UnitDetails({ roomId }: { roomId: string }) {
  const router = useRouter()
  const [action, setAction] = useState<"edit" | "delete" | null>(null)

  const unit = useQuery({
    queryKey: unitQueryKey(roomId),
    queryFn: () => fetchUnitDetails(roomId),
    // A missing room won't appear on retry, so don't keep hammering the API.
    retry: (count, error) => getApiErrorStatus(error) !== 404 && count < 2,
  })

  if (unit.isPending) return <UnitDetailsSkeleton />

  if (unit.isError) {
    const notFound = getApiErrorStatus(unit.error) === 404
    return (
      <div className="grid gap-6">
        <BackToUnits />
        <Card className="border-iron/30 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-bold">
              {notFound ? "Unit not found" : "We couldn't load this unit"}
            </CardTitle>
            <CardDescription>
              {notFound
                ? "This room may have been deleted or the link is out of date."
                : getApiErrorMessage(unit.error, "Something went wrong.")}
            </CardDescription>
          </CardHeader>
          {notFound ? null : (
            <CardContent>
              <Button
                type="button"
                variant="outline"
                className="w-fit"
                onClick={() => unit.refetch()}
              >
                Retry
              </Button>
            </CardContent>
          )}
        </Card>
      </div>
    )
  }

  const room = unit.data

  return (
    <div className="grid gap-6">
      <BackToUnits />

      {/* Title row with the update / delete CTAs */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="truncate font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Room {room.room_number}
          </h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <UnitStatusBadge status={room.status} />
            <span>{getRoomTypeLabel(room.room_type)}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="default"
            className="h-11 rounded-md px-5 bg-brand-azure"
            onClick={() => setAction("edit")}
          >
            <SquarePen aria-hidden="true" />
            Update unit
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="h-11 rounded-md px-5"
            onClick={() => setAction("delete")}
          >
            <Trash2 aria-hidden="true" />
            Delete unit
          </Button>
        </div>
      </div>

      <Card className="border-iron/30 shadow-md">
        <CardContent className="gap-6">
          <UnitPhotos unit={room} />

          <Separator />

          <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <DetailItem label="Room number" value={room.room_number} />
            <DetailItem
              label="Room type"
              value={getRoomTypeLabel(room.room_type)}
            />
            <DetailItem
              label="Status"
              value={<UnitStatusBadge status={room.status} />}
            />
            <DetailItem
              label="Max occupancy"
              value={`${room.max_occupancy} ${room.max_occupancy === 1 ? "guest" : "guests"}`}
            />
            <DetailItem
              label="Rate / night"
              value={formatCurrency(room.base_rate)}
              mono
            />

            <DetailItem
              label="Added"
              value={formatTimestamp(room.created_at)}
            />
          </dl>

          <Separator />

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="grid gap-2">
              <h3 className="font-ibm-plex text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Description
              </h3>
              <p className="text-base whitespace-pre-line text-foreground">
                {room.description?.trim() || (
                  <span className="text-muted-foreground">
                    No description added.
                  </span>
                )}
              </p>
            </div>

            <div className="grid gap-2">
              <h3 className="font-ibm-plex text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Amenities
              </h3>
              {room.amenities?.length ? (
                <ul className="flex flex-wrap gap-2">
                  {room.amenities.map((amenity) => (
                    <li
                      key={amenity}
                      className="rounded-full bg-brand-azure/10 px-3 py-1 text-sm font-medium text-brand-navy dark:bg-brand-azure/20 dark:text-sky-200"
                    >
                      {humanizeSlug(amenity)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No amenities listed.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <EditUnitDialog
        unit={room}
        open={action === "edit"}
        onOpenChange={(open) => setAction(open ? "edit" : null)}
      />
      <DeleteUnitDialog
        unit={room}
        open={action === "delete"}
        onOpenChange={(open) => setAction(open ? "delete" : null)}
        onDeleted={() => router.replace("/units")}
      />
    </div>
  )
}

export { UnitDetails }
