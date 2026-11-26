import { useSyncExternalStore } from 'react'

export const POLICIES_CLOCK_TICK_MS = 30_000

let now = Date.now()
let timer: ReturnType<typeof setInterval> | undefined
const listeners = new Set<() => void>()

const tick = (): void => {
  now = Date.now()
  listeners.forEach((listener) => listener())
}

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener)
  if (!timer) {
    now = Date.now()
    timer = setInterval(tick, POLICIES_CLOCK_TICK_MS)
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0 && timer) {
      clearInterval(timer)
      timer = undefined
    }
  }
}

const getNow = (): number => {
  // Stopped while nothing reads it, so the first reader after a pause would see an old time.
  if (!timer && Math.abs(Date.now() - now) >= POLICIES_CLOCK_TICK_MS) now = Date.now()
  return now
}

/** One clock for the table and the panels, so a status bound to a time turns in both at the same tick. */
export const usePoliciesClock = (): number => useSyncExternalStore(subscribe, getNow, getNow)
