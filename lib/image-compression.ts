import { UserFacingError } from "@/lib/api/errors"

/**
 * Largest image a picker accepts. Images are compressed before upload, so
 * this is well above what the backend is actually sent (each upload helper
 * checks the compressed file against its own limit).
 */
export const IMAGE_PICK_MAX_BYTES = 10 * 1024 * 1024

/** Images larger than this are compressed before they're uploaded. */
export const COMPRESS_ABOVE_BYTES = 1024 * 1024

/** Roughly what a compressed image should come out at (≈500 KB). */
const TARGET_SIZE_MB = 0.5

/**
 * Long edge after compression. Big enough for a room photo or a legible ID
 * scan, and scaling down is most of what gets a phone photo under target.
 */
const MAX_DIMENSION_PX = 2048

/** Formats the canvas can re-encode; GIFs, SVGs and PDFs go up untouched. */
const COMPRESSIBLE_TYPES = ["image/jpeg", "image/png", "image/webp"]

/**
 * Shrinks an image over 1 MB to about 500 KB or less, keeping its name and
 * format. Anything else (small images, PDFs) is returned as-is, and so is
 * the original if compression fails or wouldn't make the file smaller, so
 * an upload never fails because of this step.
 */
export async function compressImage(file: File): Promise<File> {
  if (
    file.size <= COMPRESS_ABOVE_BYTES ||
    !COMPRESSIBLE_TYPES.includes(file.type)
  ) {
    return file
  }

  try {
    // Loaded on demand: it's browser-only and only needed for large images.
    const { default: imageCompression } =
      await import("browser-image-compression")
    const compressed = await imageCompression(file, {
      maxSizeMB: TARGET_SIZE_MB,
      maxWidthOrHeight: MAX_DIMENSION_PX,
      initialQuality: 0.8,
      // The worker loads the library from a CDN at runtime; stay on the main
      // thread so uploads don't depend on a third-party script.
      useWebWorker: false,
    })
    if (compressed.size >= file.size) return file
    return new File([compressed], file.name, {
      type: compressed.type,
      lastModified: file.lastModified,
    })
  } catch {
    return file
  }
}

/**
 * `compressImage`, then a check that the result fits the endpoint's limit,
 * so an image that wouldn't shrink enough fails here with a clear message
 * instead of being rejected by the server.
 */
export async function prepareUpload(file: File, maxUploadBytes: number) {
  const prepared = await compressImage(file)
  if (prepared.size > maxUploadBytes) {
    throw new UserFacingError(
      `"${file.name}" is too large to upload, even after compressing it (the limit is ${maxUploadBytes / (1024 * 1024)} MB). Pick a smaller image.`
    )
  }
  return prepared
}

/** `prepareUpload` over several files, in parallel, keeping their order. */
export function prepareUploads(files: readonly File[], maxUploadBytes: number) {
  return Promise.all(files.map((file) => prepareUpload(file, maxUploadBytes)))
}
