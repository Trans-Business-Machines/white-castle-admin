import { axiosInstance } from "@/lib/axios"
import type { RolePayload } from "@/lib/schemas/roles"
import type { Role } from "@/lib/types"

export const rolesQueryKey = ["roles"] as const

export async function fetchRoles() {
  const response = await axiosInstance.get<Role[]>("/auth/roles")
  return response.data
}

export async function createRole(payload: RolePayload) {
  const response = await axiosInstance.post<Role>("/auth/roles", payload)
  return response.data
}

/** DELETE /auth/roles/{name} → removes the role. */
export async function deleteRole(name: string) {
  const response = await axiosInstance.delete(
    `/auth/roles/${encodeURIComponent(name)}`
  )
  return response.data
}
