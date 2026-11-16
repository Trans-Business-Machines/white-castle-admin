"use client"

import { useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { formatDistanceToNow, parseISO } from "date-fns"
import {
  AlertCircle,
  CheckCheck,
  Clock,
  ImagePlus,
  Loader,
  Play,
  RefreshCw,
  Sparkles,
} from "lucide-react"
import toast from "react-hot-toast"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getApiErrorMessage } from "@/lib/api/errors"
import {
  completeHousekeepingTask,
  fetchHousekeepingStats,
  fetchHousekeepingTasks,
  housekeepingQueryKey,
  housekeepingStatsQueryKey,
  housekeepingTasksQueryKey,
  startHousekeepingTask,
  uploadHousekeepingPhoto,
} from "@/lib/api/housekeeping"
import { bookingsQueryKey } from "@/lib/api/bookings"
import { unitsQueryKey } from "@/lib/api/units"
import { formatTimestamp, humanizeSlug } from "@/lib/format"
import type {
  HousekeepingPriority,
  HousekeepingTask,
  HousekeepingTaskStatus,
} from "@/lib/types"

type QueueFilter = "pending" | "in_progress" | "completed" | "all"

const FILTERS: { value: QueueFilter; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "all", label: "All" },
]

const PRIORITY_CLASSES: Record<HousekeepingPriority, string> = {
  urgent:
    "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  high: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  normal:
    "bg-brand-azure/10 text-brand-azure dark:bg-brand-azure/20 dark:text-sky-300",
  low: "bg-muted text-muted-foreground",
}

const STATUS_CLASSES: Record<HousekeepingTaskStatus, string> = {
  pending:
    "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  in_progress:
    "bg-brand-azure/10 text-brand-azure dark:bg-brand-azure/20 dark:text-sky-300",
  completed:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  skipped: "bg-muted text-muted-foreground",
}

const PRIORITY_ORDER: Record<HousekeepingPriority, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
}

function PriorityBadge({ priority }: { priority: HousekeepingPriority }) {
  return (
    <span
      className={`inline-flex h-5 items-center rounded-full px-2 text-[11px] font-bold tracking-wide uppercase ${PRIORITY_CLASSES[priority]}`}
    >
      {priority}
    </span>
  )
}

function StatusBadge({ status }: { status: HousekeepingTaskStatus }) {
  return (
    <span
      className={`inline-flex h-5 items-center rounded-full px-2 text-[11px] font-bold tracking-wide uppercase ${STATUS_CLASSES[status]}`}
    >
      {humanizeSlug(status)}
    </span>
  )
}

function TaskCard({ task }: { task: HousekeepingTask }) {
  const queryClient = useQueryClient()
  const fileInput = useRef<HTMLInputElement>(null)

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: housekeepingQueryKey }),
      queryClient.invalidateQueries({ queryKey: unitsQueryKey }),
      queryClient.invalidateQueries({ queryKey: bookingsQueryKey }),
    ])

  const start = useMutation({
    mutationFn: () => startHousekeepingTask(task.task_id),
    onSuccess: async () => {
      await invalidate()
      toast.success(`Started cleaning room ${task.room_number}.`)
    },
    onError: (error) =>
      toast.error(
        getApiErrorMessage(error, "Couldn't start this cleaning task.")
      ),
  })

  const complete = useMutation({
    mutationFn: () => completeHousekeepingTask(task.task_id),
    onSuccess: async () => {
      await invalidate()
      toast.success(`Room ${task.room_number} cleaned.`)
    },
    onError: (error) =>
      toast.error(
        getApiErrorMessage(error, "Couldn't complete this cleaning task.")
      ),
  })

  const photo = useMutation({
    mutationFn: (file: File) => uploadHousekeepingPhoto(task.task_id, file),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: housekeepingQueryKey })
      toast.success(`Photo added for room ${task.room_number}.`)
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Couldn't upload the photo.")),
  })

  const busy = start.isPending || complete.isPending || photo.isPending

  return (
    <Card className="gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-heading text-lg font-bold text-foreground">
              Room {task.room_number}
            </h3>
            <PriorityBadge priority={task.priority} />
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {humanizeSlug(task.task_type)} · created{" "}
            {formatDistanceToNow(parseISO(task.created_at), {
              addSuffix: true,
            })}
          </p>
        </div>
        <StatusBadge status={task.status} />
      </div>

      {task.notes ? (
        <p className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
          {task.notes}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Clock aria-hidden="true" className="size-3.5" />
          {task.started_at
            ? `Started ${formatTimestamp(task.started_at)}`
            : "Not started"}
        </span>
        {task.completed_at ? (
          <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
            <CheckCheck aria-hidden="true" className="size-3.5" />
            Completed {formatTimestamp(task.completed_at)}
          </span>
        ) : null}
        <span>{task.assigned_to ? "Assigned" : "Unassigned"}</span>
      </div>

      {task.photos.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {task.photos.slice(0, 6).map((url) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="block"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Room ${task.room_number} cleaning photo`}
                className="size-16 rounded-md object-cover ring-1 ring-border"
              />
            </a>
          ))}
          {task.photos.length > 6 ? (
            <span className="self-end text-xs text-muted-foreground">
              +{task.photos.length - 6} more
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 border-t pt-3">
        {task.status === "pending" ? (
          <Button
            type="button"
            size="sm"
            disabled={busy}
            onClick={() => start.mutate()}
            className="rounded-full bg-brand-azure text-white hover:bg-brand-azure/90"
          >
            {start.isPending ? (
              <Loader aria-hidden="true" className="animate-spin" />
            ) : (
              <Play aria-hidden="true" />
            )}
            Start cleaning
          </Button>
        ) : null}

        {task.status === "in_progress" ? (
          <Button
            type="button"
            size="sm"
            disabled={busy}
            onClick={() => complete.mutate()}
            className="rounded-full bg-emerald-600 text-white hover:bg-emerald-600/90"
          >
            {complete.isPending ? (
              <Loader aria-hidden="true" className="animate-spin" />
            ) : (
              <CheckCheck aria-hidden="true" />
            )}
            Mark clean
          </Button>
        ) : null}

        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => fileInput.current?.click()}
          className="rounded-full"
        >
          {photo.isPending ? (
            <Loader aria-hidden="true" className="animate-spin" />
          ) : (
            <ImagePlus aria-hidden="true" />
          )}
          Add photo
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ""
            if (file) photo.mutate(file)
          }}
        />
      </div>
    </Card>
  )
}

function StatCard({
  label,
  value,
  className,
}: {
  label: string
  value: number
  className: string
}) {
  return (
    <Card className="gap-1 p-4" size="sm">
      <p className={`font-heading text-3xl font-bold ${className}`}>{value}</p>
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
    </Card>
  )
}

export function HousekeepingView() {
  const [filter, setFilter] = useState<QueueFilter>("pending")

  const tasks = useQuery({
    queryKey: housekeepingTasksQueryKey(),
    queryFn: () => fetchHousekeepingTasks(),
    staleTime: 15_000,
  })
  const stats = useQuery({
    queryKey: housekeepingStatsQueryKey,
    queryFn: fetchHousekeepingStats,
    staleTime: 15_000,
  })

  const all = tasks.data ?? []
  const counts = {
    pending: all.filter((task) => task.status === "pending").length,
    in_progress: all.filter((task) => task.status === "in_progress").length,
    completed: all.filter((task) => task.status === "completed").length,
    all: all.length,
  }

  const visible = (
    filter === "all" ? all : all.filter((task) => task.status === filter)
  ).sort((a, b) => {
    const priority = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    return priority !== 0
      ? priority
      : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-heading text-xs font-semibold tracking-wide text-iron uppercase">
            Cleaning queue
          </p>
          <h1 className="mt-1 flex items-center gap-2 font-heading text-2xl font-bold text-foreground">
            <Sparkles aria-hidden="true" className="size-6 text-brand-azure" />
            Housekeeping
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Turnover tasks are created automatically on checkout. Start a
            clean, add a photo and mark the room clean.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            void tasks.refetch()
            void stats.refetch()
          }}
          disabled={tasks.isFetching}
          className="rounded-full"
        >
          <RefreshCw
            aria-hidden="true"
            className={tasks.isFetching ? "animate-spin" : undefined}
          />
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Pending"
          value={stats.data?.pending ?? counts.pending}
          className="text-amber-600 dark:text-amber-400"
        />
        <StatCard
          label="In progress"
          value={stats.data?.in_progress ?? counts.in_progress}
          className="text-brand-azure"
        />
        <StatCard
          label="Completed"
          value={stats.data?.completed ?? counts.completed}
          className="text-emerald-600 dark:text-emerald-400"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((option) => {
          const active = filter === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              className={`inline-flex h-9 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors ${
                active
                  ? "border-brand-azure bg-brand-azure text-white"
                  : "border-border bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              {option.label}
              <span
                className={`rounded-full px-1.5 text-xs tabular-nums ${
                  active ? "bg-white/20" : "bg-muted"
                }`}
              >
                {counts[option.value]}
              </span>
            </button>
          )
        })}
      </div>

      {tasks.isError ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
        >
          <span className="inline-flex items-center gap-2">
            <AlertCircle aria-hidden="true" className="size-4" />
            {getApiErrorMessage(
              tasks.error,
              "We couldn't load the housekeeping queue."
            )}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void tasks.refetch()}
            className="rounded-full"
          >
            Retry
          </Button>
        </div>
      ) : null}

      {tasks.isPending ? (
        <div className="grid gap-3 xl:grid-cols-2">
          {[0, 1, 2, 3].map((key) => (
            <Card key={key} className="h-40 animate-pulse bg-muted/40 p-4" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <Card className="items-center gap-2 p-10 text-center">
          <CheckCheck
            aria-hidden="true"
            className="size-8 text-emerald-600 dark:text-emerald-400"
          />
          <p className="font-heading text-lg font-semibold">
            {filter === "pending"
              ? "No rooms waiting to be cleaned."
              : `No ${filter.replace("_", " ")} tasks.`}
          </p>
          <p className="max-w-md text-sm text-muted-foreground">
            New cleaning tasks appear here automatically when a guest checks
            out.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {visible.map((task) => (
            <TaskCard key={task.task_id} task={task} />
          ))}
        </div>
      )}
    </section>
  )
}
