import { OVERLAY_KINDS, type OverlayKind } from './kinds'

type DueOverlay = { kind: OverlayKind; arrival: number }

const rank = ({ kind }: DueOverlay) => OVERLAY_KINDS.indexOf(kind)

const comesBefore = (a: DueOverlay, b: DueOverlay) => (rank(a) === rank(b) ? a.arrival < b.arrival : rank(a) < rank(b))

/**
 * The overlay that has the screen: the acknowledged one while it stays due, otherwise the due overlay of the most
 * important kind, the earliest arrival first.
 */
export const pickShown = (due: ReadonlyMap<string, DueOverlay>, acknowledged: string | null): string | null => {
  if (acknowledged !== null && due.has(acknowledged)) return acknowledged

  let shown: [string, DueOverlay] | undefined
  for (const entry of due) {
    if (!shown || comesBefore(entry[1], shown[1])) shown = entry
  }
  return shown?.[0] ?? null
}

const due = new Map<string, DueOverlay>()
// The overlay that rendered as shown; a more important kind that becomes due later waits for it.
let acknowledged: string | null = null
let arrivals = 0
const listeners = new Set<() => void>()

const notify = () => listeners.forEach((listener) => listener())

export const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const getShown = (): string | null => pickShown(due, acknowledged)

export const setDue = (key: string, kind: OverlayKind) => {
  if (due.has(key)) return
  due.set(key, { kind, arrival: arrivals++ })
  notify()
}

export const clearDue = (key: string) => {
  if (!due.delete(key)) return
  if (acknowledged === key) acknowledged = null
  notify()
}

/** Called once the overlay rendered as shown, so that it keeps the screen until it closes. */
export const acknowledge = (key: string) => {
  if (getShown() === key) acknowledged = key
}

export const _resetOverlayQueue = () => {
  due.clear()
  acknowledged = null
  arrivals = 0
  notify()
}
