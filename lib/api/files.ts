import { format } from "date-fns"
import { isAxiosError } from "axios"
import { axiosInstance } from "@/lib/axios"
import { getDispositionFilename } from "@/lib/download"

/** Query params for the CSV exports; "" means the filter isn't set. */
export interface ExportFilters {
  status: string
  /** yyyy-MM-dd */
  date_from: string
  date_to: string
}

/**
 * GETs a file export, dropping empty params. The file name comes from
 * `Content-Disposition` when the server sends one, else
 * `<fallbackName>-<today>.csv`.
 */
export async function downloadCsv(
  path: string,
  filters: ExportFilters,
  fallbackName: string
) {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== "")
  )
  try {
    const response = await axiosInstance.get<Blob>(path, {
      params,
      responseType: "blob",
    })
    return {
      blob: response.data,
      filename:
        getDispositionFilename(response.headers["content-disposition"]) ??
        `${fallbackName}-${format(new Date(), "yyyy-MM-dd")}.csv`,
    }
  } catch (error) {
    throw await parseBlobError(error)
  }
}

/**
 * A `responseType: "blob"` request gets its error body as a Blob too; this
 * turns the JSON `detail` back into an object so `getApiErrorMessage` can
 * read it. Returns the (possibly patched) error for the caller to rethrow.
 */
export async function parseBlobError(error: unknown) {
  if (isAxiosError(error) && error.response?.data instanceof Blob) {
    try {
      error.response.data = JSON.parse(await error.response.data.text())
    } catch {
      // Not JSON; the caller falls back to its generic message.
    }
  }
  return error
}
