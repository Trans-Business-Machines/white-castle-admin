/**
 * Pulls the file name out of a `Content-Disposition` header, e.g.
 * `attachment; filename="bookings.csv"`. Returns `null` when there isn't one.
 */
export function getDispositionFilename(header: unknown) {
  if (typeof header !== "string") return null
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(header)
  if (encoded) return decodeURIComponent(encoded[1].trim())
  const plain = /filename="?([^";]+)"?/i.exec(header)
  return plain ? plain[1].trim() : null
}

/** Hands a downloaded file to the browser's save flow. */
export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  // Revoke on the next tick so the click has started the download first.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
