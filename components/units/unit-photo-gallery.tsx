"use client"

import { useMemo } from "react"
import Image from "next/image"
import { cn } from "cn"
import Autoplay from "embla-carousel-autoplay"
import { ImageOff } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"

const HIGHLIGHTS = 4

const AUTOPLAY_DELAY_MS = 5000

const overlayButtonClassName =
  "cursor-pointer border-none bg-background/80 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 focus-visible:opacity-100"

/**
 * A room's photos as one panel: an auto-advancing carousel of every photo on
 * the left, and the next four as a grid beside it from `lg` up. Only the
 * panel's outer corners are rounded so the two halves read as a single
 * surface.
 */
export function UnitPhotoGallery({
  photos,
  roomNumber,
}: {
  photos: string[]
  roomNumber: string
}) {
  const reducedMotion = usePrefersReducedMotion()

  // One plugin instance for the life of the gallery; a fresh one on every
  // render would re-initialise the carousel and restart the timer. (A ref
  // would do too, but reading `.current` during render is a lint error here.)
  const plugins = useMemo(
    () =>
      reducedMotion
        ? []
        : [Autoplay({ delay: AUTOPLAY_DELAY_MS, stopOnInteraction: false })],
    [reducedMotion]
  )

  if (photos.length === 0) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-canvas text-muted-foreground dark:bg-input/30">
        <ImageOff aria-hidden="true" className="size-6" />
        <p className="text-sm">No photos uploaded for this room yet.</p>
      </div>
    )
  }

  const highlights = photos.slice(1, HIGHLIGHTS + 1)
  // With nothing beside it the carousel takes the full width and rounds on
  // every corner instead of only the left pair.
  const solo = highlights.length === 0

  return (
    <div className="grid items-stretch gap-3 lg:grid-cols-4">
      {/* Main carousel */}
      <div className={cn("lg:col-span-2", solo && "lg:col-span-4")}>
        <Carousel
          plugins={plugins}
          opts={{ loop: photos.length > 1 }}
          aria-label={`Photos of room ${roomNumber}`}
          className={cn(
            "group w-full overflow-hidden rounded-xl",
            !solo && "lg:rounded-r-none"
          )}
        >
          <CarouselContent>
            {photos.map((url, index) => (
              <CarouselItem key={url}>
                <div className="relative aspect-4/3">
                  <Image
                    src={url}
                    alt={`Room ${roomNumber}, photo ${index + 1}`}
                    fill
                    priority={index === 0}
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
                  <div className="absolute right-4 bottom-4">
                    <Badge
                      variant="secondary"
                      className="bg-background/80 text-foreground backdrop-blur-md"
                    >
                      {index + 1} / {photos.length}
                    </Badge>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {photos.length > 1 ? (
            <>
              <CarouselPrevious
                className={cn(overlayButtonClassName, "left-4")}
              />
              <CarouselNext className={cn(overlayButtonClassName, "right-4")} />
            </>
          ) : null}
        </Carousel>
      </div>

      {/* Highlight images */}
      {solo ? null : (
        <div className="hidden grid-cols-2 grid-rows-2 gap-3 lg:col-span-2 lg:grid">
          {highlights.map((url, index) => (
            <div
              key={url}
              className={cn(
                "group relative aspect-4/3 overflow-hidden",
                // Only the panel's outer corners are rounded; the tiles that
                // sit against the carousel stay square.
                index === 1 && "rounded-tr-xl",
                index === highlights.length - 1 &&
                  index % 2 === 1 &&
                  "rounded-br-xl"
              )}
            >
              <Image
                src={url}
                alt={`Room ${roomNumber}, photo ${index + 2}`}
                fill
                sizes="(max-width: 1024px) 0px, 25vw"
                className="object-cover transition-transform duration-200 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
