import { axiosInstance } from "@/lib/axios"
import type { CreateUserPayload } from "@/lib/schemas/users"
import type { RoleName } from "@/lib/roles"
import type { AuthUser, UserStats } from "@/lib/types"

export interface UserListFilters {
  /** Role slug; "" means every role. */
  role: RoleName | ""
}

export const usersQueryKey = ["users"] as const
export const userStatsQueryKey = ["users", "stats"] as const
/** Prefixed by `usersQueryKey`, so invalidating that refreshes every list. */
export const usersListQueryKey = (filters: UserListFilters) =>
  ["users", "list", filters] as const

/** GET /auth/users?role= → staff accounts, optionally for one role. */
export async function fetchUsers(filters: UserListFilters) {
  const response = await axiosInstance.get<AuthUser[]>("/auth/users", {
    params: filters.role ? { role: filters.role } : undefined,
  })
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

/** POST /auth/users/{id}/unlock → clears a lock from too many failed sign-ins. */
export async function unlockUser(userId: string) {
  const response = await axiosInstance.post(
    `/auth/users/${encodeURIComponent(userId)}/unlock`
  )
  return response.data
}

/** DELETE /auth/users/{id} → permanently removes the account. */
export async function deleteUser(userId: string) {
  await axiosInstance.delete(`/auth/users/${encodeURIComponent(userId)}`)
}
