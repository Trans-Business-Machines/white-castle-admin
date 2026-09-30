import { axiosInstance } from "@/lib/axios"
import { prepareUpload } from "@/lib/image-compression"
import { downloadCsv, type ExportFilters } from "@/lib/api/files"
import { EVIDENCE_MAX_BYTES } from "@/lib/schemas/payments"
import type {
  CompletePaymentParams,
  CreatePaymentPayload,
  Payment,
  PaymentStats,
  RejectPaymentPayload,
  SignedFile,
} from "@/lib/types"

export const paymentsQueryKey = ["payments"] as const
export const paymentsListQueryKey = (filters: PaymentListFilters) =>
  ["payments", "list", filters] as const
// Under the payments prefix (not `["reports"]`) so recording a payment,
// which invalidates `paymentsQueryKey`, refreshes the cards too.
export const paymentEvidenceQueryKey = (fileId: string) =>
  ["payments", "evidence", fileId] as const
export const paymentStatsQueryKey = (range: DateRange) =>
  ["payments", "stats", range.date_from, range.date_to] as const
// Under the payments prefix so recording, verifying or rejecting a payment
// refreshes the sidebar badge that counts these.
export const pendingPaymentsQueryKey = ["payments", "pending"] as const

/** Inclusive "yyyy-MM-dd" bounds. */
export interface DateRange {
  date_from: string
  date_to: string
}

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

/** GET /payments/pending → every payment still waiting to be verified. */
export async function fetchPendingPayments() {
  const response = await axiosInstance.get<Payment[]>("/payments/pending")
  return response.data
}

/** GET /payments/stats → payment counts and totals by status for a range. */
export async function fetchPaymentStats(range: DateRange) {
  const response = await axiosInstance.get<PaymentStats>("/payments/stats", {
    params: range,
  })
  return response.data
}

/**
 * GET /payments/export/payments → the payments matching the filters as a
 * CSV file (empty filters are omitted).
 */
export function exportPayments(filters: ExportFilters) {
  return downloadCsv("/payments/export/payments", filters, "payments")
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

/**
 * PATCH /payments/{id}/verify → marks a pending payment as verified. The
 * body is an empty JSON object (`{}`): the backend records who verified it
 * from the access token.
 */
export async function verifyPayment(paymentId: string) {
  const response = await axiosInstance.patch<Payment>(
    `/payments/${encodeURIComponent(paymentId)}/verify`,
    {}
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
 * before it uploads. An image over 1 MB is compressed first and
 * must then fit `EVIDENCE_MAX_BYTES` (`prepareUpload`).
 */
export async function uploadPaymentEvidence(paymentId: string, file: File) {
  const body = new FormData()
  body.append("file", await prepareUpload(file, EVIDENCE_MAX_BYTES))
  await axiosInstance.post(
    `/payments/${encodeURIComponent(paymentId)}/evidence`,
    body
  )
}

/**
 * GET /payments/evidence/{file_id} → a signed, short-lived URL for the
 * proof-of-payment image, plus its file name. `file_id` is the last path
 * segment of the payment's `evidence_url`.
 */
export async function fetchPaymentEvidence(fileId: string) {
  const response = await axiosInstance.get<SignedFile>(
    `/payments/evidence/${encodeURIComponent(fileId)}`
  )
  return response.data
}
