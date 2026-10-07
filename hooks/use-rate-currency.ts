"use client"

import { useSyncExternalStore } from "react"
import type { BookingCurrency } from "@/lib/types"

const STORAGE_KEY = "white-castle:rate-currency"
const DEFAULT_RATE_CURRENCY: BookingCurrency = "KES"

const listeners = new Set<() => void>()

function readRateCurrency(): BookingCurrency {
  try {
    return localStorage.getItem(STORAGE_KEY) === "USD" ? "USD" : "KES"
  } catch {
    // Storage can be blocked (private windows, cleared site data).
    return DEFAULT_RATE_CURRENCY
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  // Another tab changing the preference fires `storage` here.
  window.addEventListener("storage", listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", listener)
  }
}

// Holds the choice only when storage refused to save it.
let unsaved: BookingCurrency | null = null

function getSnapshot() {
  return unsaved ?? readRateCurrency()
}

function setRateCurrency(currency: BookingCurrency) {
  try {
    localStorage.setItem(STORAGE_KEY, currency)
    unsaved = null
  } catch {
    // Not remembered, but still applied until the page reloads.
    unsaved = currency
  }
  listeners.forEach((listener) => listener())
}

/**
 * The currency room rates are shown in (KES for residents, USD for
 * non-residents), remembered per browser in localStorage. Every caller
 * shares the same value, so the header switch updates the units views.
 */
export function useRateCurrency() {
  const currency = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => DEFAULT_RATE_CURRENCY
  )
  return [currency, setRateCurrency] as const
}
