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

export type LoginStep =
  | { kind: "tokens" }
  | { kind: "operator"; challenge: string; account: string }

export async function login(values: LoginValues): Promise<LoginStep> {
  const response = await axios.post(`${API_BASE}/auth/login`, values, {
    withCredentials: true,
  })
  // A shared role account asks for the operator's username + PIN first.
  if (response.data?.operator_required) {
    return {
      kind: "operator",
      challenge: String(response.data.challenge),
      account: String(response.data.account ?? values.username),
    }
  }
  setAccessToken(pickAccessToken(response.data))
  return { kind: "tokens" }
}

/** Second login step for shared accounts. */
export async function completeOperatorLogin(
  challenge: string,
  username: string,
  pin: string
) {
  const response = await axios.post(
    `${API_BASE}/auth/login/operator`,
    { challenge, username, pin },
    { withCredentials: true }
  )
  setAccessToken(pickAccessToken(response.data))
  return response.data as {
    must_change_password?: boolean
    must_change_pin?: boolean
  }
}

/** Sets a new PIN for the signed-in operator. */
export async function changeOperatorPin(currentPin: string, newPin: string) {
  await axiosInstance.patch("/auth/operator/pin", {
    current_pin: currentPin,
    new_pin: newPin,
  })
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
