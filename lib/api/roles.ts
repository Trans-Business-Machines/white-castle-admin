import { axiosInstance } from "@/lib/axios"
import type { Permission, Role } from "@/lib/types"

export const rolesQueryKey = ["roles"] as const
export const permissionsQueryKey = ["permissions"] as const
export const rolePermissionsQueryKey = (name: string) =>
  ["roles", name, "permissions"] as const

export async function fetchRoles() {
  const response = await axiosInstance.get<Role[]>("/auth/roles")
  return response.data
}

/** Every permission the backend knows about, grouped by module in the UI. */
export async function fetchPermissions() {
  const response = await axiosInstance.get<Permission[]>("/auth/permissions")
  return response.data
}

export async function fetchRolePermissions(name: string) {
  const response = await axiosInstance.get<Permission[]>(
    `/auth/roles/${encodeURIComponent(name)}/permissions`
  )
  return response.data
}

export async function updateRolePermissions(name: string, slugs: string[]) {
  const response = await axiosInstance.put<{
    role: string
    permissions: string[]
  }>(`/auth/roles/${encodeURIComponent(name)}/permissions`, { slugs })
  return response.data
}

export async function createRole(payload: {
  name: string
  label: string
  description?: string
}) {
  const response = await axiosInstance.post<Role>("/auth/roles", payload)
  return response.data
}

export async function deleteRole(name: string) {
  await axiosInstance.delete(`/auth/roles/${encodeURIComponent(name)}`)
}
