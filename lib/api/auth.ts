import { API_BASE, axiosInstance } from "@/lib/axios"
import { pickAccessToken, setAccessToken } from "@/lib/auth-token"
import type { LoginValues } from "@/lib/schemas/auth"
import type { AuthUser } from "@/lib/types"
import axios from "axios"

/*
 * Unauthenticated calls (login, password reset) go through bare `axios` so the
 * bearer-injection / refresh-and-retry interceptors never apply to them.
 * `withCredentials` is still needed so the backend can set the refresh cookie.
 */

export async function login(values: LoginValues) {
  const response = await axios.post(`${API_BASE}/auth/login`, values, {
    withCredentials: true,
  })
  const token = pickAccessToken(response.data)
  setAccessToken(token)
  return token
}

export async function fetchMe() {
  const response = await axiosInstance.get<AuthUser>("/auth/me")
  return response.data
}

export async function logout() {
  await axiosInstance.post("/auth/logout")
}

export async function requestPasswordReset(email: string) {
  await axios.post(
    `${API_BASE}/auth/password-reset`,
    { email },
    { withCredentials: true }
  )
}

export async function confirmPasswordReset(token: string, newPassword: string) {
  await axios.post(
    `${API_BASE}/auth/password-reset/confirm`,
    { token, new_password: newPassword },
    { withCredentials: true }
  )
}


export async function changePassword(
  currentPassword: string,
  newPassword: string
) {
  await axiosInstance.patch("/auth/change-password", {
    current_password: currentPassword,
    new_password: newPassword,
  })
}
