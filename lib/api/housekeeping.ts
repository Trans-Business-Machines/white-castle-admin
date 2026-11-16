import { axiosInstance } from "@/lib/axios"
import type {
  HousekeepingStats,
  HousekeepingTask,
  HousekeepingTaskStatus,
} from "@/lib/types"

export const housekeepingQueryKey = ["housekeeping"] as const
export const housekeepingTasksQueryKey = (status?: HousekeepingTaskStatus) =>
  ["housekeeping", "tasks", status ?? "all"] as const
export const housekeepingStatsQueryKey = ["housekeeping", "stats"] as const

/** GET /motel/housekeeping → up to 200 tasks, filtered by status when set. */
export async function fetchHousekeepingTasks(status?: HousekeepingTaskStatus) {
  const response = await axiosInstance.get<HousekeepingTask[]>(
    "/motel/housekeeping",
    { params: status ? { status } : undefined }
  )
  return response.data
}

/** GET /motel/housekeeping/stats → counts for the queue cards. */
export async function fetchHousekeepingStats() {
  const response = await axiosInstance.get<HousekeepingStats>(
    "/motel/housekeeping/stats"
  )
  return response.data
}

/** PATCH /motel/housekeeping/{id}/start → marks the task in progress. */
export async function startHousekeepingTask(taskId: string) {
  const response = await axiosInstance.patch<HousekeepingTask>(
    `/motel/housekeeping/${encodeURIComponent(taskId)}/start`
  )
  return response.data
}

/**
 * PATCH /motel/housekeeping/{id}/complete → completes the task. The backend
 * also puts the room back to `available` when no maintenance issue is open.
 */
export async function completeHousekeepingTask(taskId: string) {
  const response = await axiosInstance.patch<HousekeepingTask>(
    `/motel/housekeeping/${encodeURIComponent(taskId)}/complete`
  )
  return response.data
}

/** POST /motel/housekeeping/{id}/photos → attaches a photo of the cleaned room. */
export async function uploadHousekeepingPhoto(taskId: string, file: File) {
  const body = new FormData()
  body.append("file", file)
  const response = await axiosInstance.post<{
    task_id: string
    photo_url: string
  }>(`/motel/housekeeping/${encodeURIComponent(taskId)}/photos`, body)
  return response.data
}
