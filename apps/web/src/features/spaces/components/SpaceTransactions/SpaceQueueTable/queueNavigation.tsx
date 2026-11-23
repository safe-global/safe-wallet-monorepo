import { createContext, useCallback, useContext, useSyncExternalStore } from 'react'
import { getNonce } from '../utils'
import { getChainKey, getGroupId, type QueueGroup } from './queueGroups'
import type { QueueListItem } from './queueList'

/** A transaction the queue can take the user to: its Safe, chain and nonce */
export type QueueTarget = { safeAddress: string; chainId: string; nonce: number }

/** How long the row the user was taken to stays highlighted, then how long the highlight fades */
export const HIGHLIGHT_MS = 2000
export const HIGHLIGHT_FADE_MS = 700

const matches = (scopeKey: string, nonce: number | undefined, target: QueueTarget): boolean =>
  scopeKey === getChainKey(target.safeAddress, target.chainId) && nonce === target.nonce

/** The row of the target among the rendered rows: the first option when several transactions share the nonce */
export const findTargetIndex = (items: QueueListItem[], target: QueueTarget): number =>
  items.findIndex(
    (item) => item.kind === 'transaction' && matches(item.scopeKey, getNonce(item.item.transaction), target),
  )

/** The band that holds the target in a grouping, undefined when it has none */
export const findTargetGroupId = (groups: QueueGroup[], target: QueueTarget): string | undefined => {
  const group = groups.find(
    (candidate) =>
      candidate.kind !== 'all' &&
      candidate.units.some((unit) =>
        unit.transactions.some(({ item }) => matches(unit.scopeKey, getNonce(item.transaction), target)),
      ),
  )
  return group && getGroupId(group)
}

export type HighlightPhase = 'on' | 'fading'

/** The row highlighted after a go-to, by transaction id: on, then fading, then gone. Rows subscribe to their own id. */
export const createHighlightStore = () => {
  let state: { txId: string; phase: HighlightPhase; focus: boolean } | undefined
  let timers: ReturnType<typeof setTimeout>[] = []
  const listeners = new Set<() => void>()
  const notify = () => listeners.forEach((listener) => listener())
  const clearTimers = () => {
    timers.forEach(clearTimeout)
    timers = []
  }

  return {
    highlight: (txId: string) => {
      clearTimers()
      state = { txId, phase: 'on', focus: true }
      notify()
      timers = [
        setTimeout(() => {
          if (state) state = { ...state, phase: 'fading' }
          notify()
        }, HIGHLIGHT_MS),
        setTimeout(() => {
          state = undefined
          notify()
        }, HIGHLIGHT_MS + HIGHLIGHT_FADE_MS),
      ]
    },
    getPhase: (txId: string): HighlightPhase | undefined => (state?.txId === txId ? state.phase : undefined),
    /** True once, for the highlighted row: it takes the focus when it mounts or is highlighted */
    takeFocus: (txId: string): boolean => {
      if (state?.txId !== txId || !state.focus) return false
      state = { ...state, focus: false }
      return true
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    dispose: clearTimers,
  }
}

export type HighlightStore = ReturnType<typeof createHighlightStore>

type QueueNavigation = { goTo: (target: QueueTarget) => void; highlights: HighlightStore }

export const QueueNavigationContext = createContext<QueueNavigation | null>(null)

/** Takes the queue to a transaction, expanding its band; undefined outside the queue table */
export const useQueueGoTo = (): QueueNavigation['goTo'] | undefined => useContext(QueueNavigationContext)?.goTo

const noSubscribe = () => () => {}
const noPhase = () => undefined

/** Whether this row is the one the queue was taken to */
export const useRowHighlight = (txId: string): { phase: HighlightPhase | undefined; takeFocus: () => boolean } => {
  const highlights = useContext(QueueNavigationContext)?.highlights
  const read = highlights ? () => highlights.getPhase(txId) : noPhase
  const phase = useSyncExternalStore(highlights?.subscribe ?? noSubscribe, read, read)
  const takeFocus = useCallback(() => highlights?.takeFocus(txId) ?? false, [highlights, txId])
  return { phase, takeFocus }
}
