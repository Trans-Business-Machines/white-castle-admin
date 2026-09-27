import { axiosInstance } from "@/lib/axios"
import type { Role } from "@/lib/types"

export const rolesQueryKey = ["roles"] as const

export async function fetchRoles() {
  const response = await axiosInstance.get<Role[]>("/auth/roles")
  return response.data
}
