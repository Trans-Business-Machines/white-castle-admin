import { axiosInstance } from "@/lib/axios"
import type { SettingPayload } from "@/lib/schemas/settings"
import type { MotelSetting } from "@/lib/types"

export const settingsQueryKey = ["settings"] as const

/** GET /motel/settings → every motel-wide setting. */
export async function fetchSettings() {
  const response = await axiosInstance.get<MotelSetting[]>("/motel/settings")
  return response.data
}

/** PATCH /motel/settings/{key} → sets one setting's value and returns it. */
export async function updateSetting(key: string, payload: SettingPayload) {
  const response = await axiosInstance.patch<MotelSetting>(
    `/motel/settings/${encodeURIComponent(key)}`,
    payload
  )
  return response.data
}
