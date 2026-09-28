import { axiosInstance } from "@/lib/axios"
import type { SettingPayload } from "@/lib/schemas/settings"
import type { MotelSetting } from "@/lib/types"

export const settingsQueryKey = ["settings"] as const
/** Under the settings prefix, so editing any setting refreshes it too. */
export const settingQueryKey = (key: string) => ["settings", key] as const

/** The share of a booking's total taken as a deposit (e.g. "25"). */
export const DEPOSIT_PERCENTAGE_KEY = "deposit_percentage"

/** GET /motel/settings → every motel-wide setting. */
export async function fetchSettings() {
  const response = await axiosInstance.get<MotelSetting[]>("/motel/settings")
  return response.data
}

/** GET /motel/settings/{key} → a single setting. */
export async function fetchSetting(key: string) {
  const response = await axiosInstance.get<MotelSetting>(
    `/motel/settings/${encodeURIComponent(key)}`
  )
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
