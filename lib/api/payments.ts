import { axiosInstance } from "@/lib/axios"
import type { CreatePaymentPayload, Payment } from "@/lib/types"

export const paymentsQueryKey = ["payments"] as const
export const paymentsListQueryKey = (filters: PaymentListFilters) =>
  ["payments", "list", filters] as const

export interface PaymentListFilters {
  /** Payment status slug; "" means every status. */
  status: string
}

/** GET /payments/list → payments matching the filters (empty ones are omitted). */
export async function fetchPayments(filters: PaymentListFilters) {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== "")
  )
  const response = await axiosInstance.get<Payment[]>("/payments/list", {
    params,
  })
  return response.data
}

/** POST /payments/create → records a payment against a booking. */
export async function createPayment(payload: CreatePaymentPayload) {
  const response = await axiosInstance.post<Payment>(
    "/payments/create",
    payload
  )
  return response.data
}

/**
 * POST /payments/{id}/evidence → attaches proof of payment as multipart
 * `file`. The payment has to exist first, so the dialog saves the details
 * before it uploads.
 */
export async function uploadPaymentEvidence(paymentId: string, file: File) {
  const body = new FormData()
  body.append("file", file)
  await axiosInstance.post(
    `/payments/${encodeURIComponent(paymentId)}/evidence`,
    body
  )
}
