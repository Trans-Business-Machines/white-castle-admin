import { axiosInstance } from "@/lib/axios"
import type {
  CompletePaymentParams,
  CreatePaymentPayload,
  Payment,
  PaymentStats,
  RejectPaymentPayload,
  VerifyPaymentPayload,
} from "@/lib/types"

export const paymentsQueryKey = ["payments"] as const
export const paymentsListQueryKey = (filters: PaymentListFilters) =>
  ["payments", "list", filters] as const
// Under the payments prefix (not `["reports"]`) so recording a payment,
// which invalidates `paymentsQueryKey`, refreshes the cards too.
export const paymentStatsQueryKey = ["payments", "stats"] as const

export interface PaymentListFilters {
  /** Payment status slug; "" means every status. */
  status: string
  /** Reference to search for; "" means no search. */
  reference: string
  /** yyyy-MM-dd; "" means unbounded. */
  date_from: string
  date_to: string
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

/** GET /payments/stats → payment counts and totals by status. */
export async function fetchPaymentStats() {
  const response = await axiosInstance.get<PaymentStats>("/payments/stats")
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
 * POST /payments/complete/{booking_ref} → records the balance on a booking
 * whose deposit was paid. Everything goes in the query string; there's no
 * body.
 */
export async function completePayment(
  bookingRef: string,
  params: CompletePaymentParams
) {
  const response = await axiosInstance.post<Payment>(
    `/payments/complete/${encodeURIComponent(bookingRef)}`,
    null,
    { params }
  )
  return response.data
}

/** PATCH /payments/{id}/verify → marks a pending payment as verified. */
export async function verifyPayment(
  paymentId: string,
  payload: VerifyPaymentPayload
) {
  const response = await axiosInstance.patch<Payment>(
    `/payments/${encodeURIComponent(paymentId)}/verify`,
    payload
  )
  return response.data
}

/** PATCH /payments/{id}/reject → rejects a pending payment with a reason. */
export async function rejectPayment(
  paymentId: string,
  payload: RejectPaymentPayload
) {
  const response = await axiosInstance.patch<Payment>(
    `/payments/${encodeURIComponent(paymentId)}/reject`,
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
