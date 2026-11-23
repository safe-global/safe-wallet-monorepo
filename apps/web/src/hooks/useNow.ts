import { useSyncExternalStore } from 'react'

const TICK_MS = 1_000

let now = Date.now()
let timer: ReturnType<typeof setInterval> | undefined
const listeners = new Set<() => void>()

const tick = (): void => {
  now = Date.now()
  listeners.forEach((listener) => listener())
}

// One interval for every subscriber, running only while at least one is mounted
const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener)
  if (!timer) {
    now = Date.now()
    timer = setInterval(tick, TICK_MS)
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0 && timer) {
      clearInterval(timer)
      timer = undefined
    }
  }
}

const subscribeNothing = (): (() => void) => () => undefined

const getNow = (): number => now

/**
 * The current time, re-rendering every second while `enabled`. All callers share one interval, so a list of rows
 * with a running timer ticks together and costs one timer. While disabled the value is stale: don't read it.
 */
const useNow = (enabled = true): number => {
  const value = useSyncExternalStore(enabled ? subscribe : subscribeNothing, getNow, getNow)
  // Fresh on the first render too, before the subscription has refreshed the shared value
  return enabled ? Math.max(value, Date.now() - TICK_MS) : value
}

export default useNow
