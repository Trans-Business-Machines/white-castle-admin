import { axiosInstance } from "@/lib/axios"

export interface Operator {
  operator_id: string
  user_id: string
  username: string
  full_name: string
  active: boolean
  must_change_pin: boolean
  last_used_at: string | null
  created_at: string
}

export interface OperatorWithPin extends Operator {
  pin: string
}

export const operatorsQueryKey = (userId: string) =>
  ["operators", userId] as const

export async function fetchOperators(userId: string) {
  const response = await axiosInstance.get<Operator[]>("/auth/operators", {
    params: { user_id: userId },
  })
  return response.data
}

export async function createOperator(payload: {
  user_id: string
  full_name: string
  username: string
  pin?: string
}) {
  const response = await axiosInstance.post<OperatorWithPin>(
    "/auth/operators",
    payload
  )
  return response.data
}

export async function updateOperator(
  operatorId: string,
  payload: { full_name?: string; active?: boolean }
) {
  const response = await axiosInstance.patch<Operator>(
    `/auth/operators/${encodeURIComponent(operatorId)}`,
    payload
  )
  return response.data
}

/** Resets the PIN and returns the new (temporary) one, shown once. */
export async function resetOperatorPin(operatorId: string) {
  const response = await axiosInstance.post<OperatorWithPin>(
    `/auth/operators/${encodeURIComponent(operatorId)}/reset-pin`,
    {}
  )
  return response.data
}
