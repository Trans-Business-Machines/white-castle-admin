import { axiosInstance } from "@/lib/axios"
import type { CreateUserPayload } from "@/lib/schemas/users"
import type { AuthUser, UserStats } from "@/lib/types"

export const usersQueryKey = ["users"] as const
export const userStatsQueryKey = ["users", "stats"] as const

/** GET /auth/users → every staff's account. */
export async function fetchUsers() {
  const response = await axiosInstance.get<AuthUser[]>("/auth/users")
  return response.data
}

/** GET /auth/users/stats → account totals and the count per role. */
export async function fetchUserStats() {
  const response = await axiosInstance.get<UserStats>("/auth/users/stats")
  return response.data
}

/** POST /auth/users → creates a staff account and returns it. */
export async function createUser(payload: CreateUserPayload) {
  const response = await axiosInstance.post<AuthUser>("/auth/users", payload)
  return response.data
}

/** POST /auth/users/{id}/enable → lets the user sign in again. */
export async function enableUser(userId: string) {
  const response = await axiosInstance.post<AuthUser>(
    `/auth/users/${encodeURIComponent(userId)}/enable`
  )
  return response.data
}

/** POST /auth/users/{id}/disable → blocks sign-in without deleting. */
export async function disableUser(userId: string) {
  const response = await axiosInstance.post<AuthUser>(
    `/auth/users/${encodeURIComponent(userId)}/disable`
  )
  return response.data
}

/** DELETE /auth/users/{id} → permanently removes the account. */
export async function deleteUser(userId: string) {
  await axiosInstance.delete(`/auth/users/${encodeURIComponent(userId)}`)
}
