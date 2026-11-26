import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLazyTransactionsGetTransactionByIdV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TxEvent, txSubscribe } from '@/services/tx/txEvents'
import type {
  PendingAllowlistPolicy,
  PendingSpendingLimitPolicy,
  Policy,
} from '@safe-global/views/features/spaces/components/Policies/types'
import { getPendingTxId, isPendingChangeIndexed } from '../utils/mapPendingPolicies'
import { isAllowlistChangeServed } from '../utils/allowlistChangeServed'
import type { QueuedTxSignals } from './useQueuedTxSignals'

/** How long a row reads as executed while CGW does not serve its change; the policies are polled meanwhile. */
export const MAX_HOLD_MS = 30 * 60_000

export type QueuedPolicy = PendingSpendingLimitPolicy | PendingAllowlistPolicy

type Held = { policy: QueuedPolicy; since: number }

const keyOf = ({ id, safeTxHash }: Pick<QueuedPolicy, 'id' | 'safeTxHash'>): string => `${id}:${safeTxHash}`

const isListed = (policy: QueuedPolicy, pending: QueuedPolicy[]): boolean =>
  pending.some((next) => keyOf(next) === keyOf(policy))

const isChangeServed = (policy: QueuedPolicy, active: Policy[]): boolean =>
  policy.type === 'allowlist' ? isAllowlistChangeServed(policy, active) : isPendingChangeIndexed(policy, active)

// A row the pending policies still list stays held, so it never reads as queued again next to its served change.
const isAwaitingServe = (policy: QueuedPolicy, active: Policy[], pending: QueuedPolicy[]): boolean =>
  isListed(policy, pending) || !isChangeServed(policy, active)

const NO_SIGNALS: Pick<QueuedTxSignals, 'executed' | 'failed' | 'leftQueue'> = {
  executed: new Set(),
  failed: new Set(),
  leftQueue: new Set(),
}

type Options = {
  refetch: () => void
  /** Held rows belong to one space; a new key drops them. */
  resetKey: string | null
  /** False while the policy queries are skipped, so there is nothing to refetch. */
  enabled: boolean
  signals?: Pick<QueuedTxSignals, 'executed' | 'failed' | 'leftQueue'>
}

/**
 * The queued rows known to be executed, as activating, until CGW serves their change. A row is known executed from
 * `signals` while it is still listed, or from its transaction once it leaves the Space queue or the pending policies.
 * An allowlist row keeps its id across its changes, so its transaction is told apart by its hash.
 */
export const useActivatingPolicies = (
  pending: QueuedPolicy[],
  active: Policy[],
  { refetch, resetKey, enabled, signals = NO_SIGNALS }: Options,
): QueuedPolicy[] => {
  const [held, setHeld] = useState<Held[]>([])
  const previous = useRef<QueuedPolicy[]>([])
  const latestActive = useRef(active)
  const latestPending = useRef(pending)
  const latestHeld = useRef(held)
  const latestExecuted = useRef(signals.executed)
  const latestKey = useRef(resetKey)
  const lookedUp = useRef(new Set<string>())
  // A hold that ran out stays out, even while a signal still says the transaction executed.
  const timedOut = useRef(new Set<string>())
  const [getTransaction] = useLazyTransactionsGetTransactionByIdV1Query()

  const release = useCallback((current: Held[]): Held[] => {
    const now = Date.now()
    const next = current.filter((entry) => {
      if (now - entry.since < MAX_HOLD_MS) {
        return isAwaitingServe(entry.policy, latestActive.current, latestPending.current)
      }
      timedOut.current.add(keyOf(entry.policy))
      return false
    })
    return next.length === current.length ? current : next
  }, [])

  const hold = useCallback((rows: QueuedPolicy[]) => {
    const due = rows.filter(
      (row) => !timedOut.current.has(keyOf(row)) && isAwaitingServe(row, latestActive.current, latestPending.current),
    )
    if (due.length === 0) return

    setHeld((current) => {
      const added = due.filter((row) => !current.some((entry) => keyOf(entry.policy) === keyOf(row)))
      if (added.length === 0) return current
      return [
        ...current,
        ...added.map((row): Held => ({ policy: { ...row, status: 'activating' }, since: Date.now() })),
      ]
    })
  }, [])

  // Declared before the queue effects, so a space switch is not read as every row leaving the queue.
  useEffect(() => {
    latestKey.current = resetKey
    previous.current = []
    lookedUp.current = new Set()
    timedOut.current = new Set()
    setHeld((current) => (current.length === 0 ? current : []))
  }, [resetKey])

  useEffect(() => {
    latestActive.current = active
    latestPending.current = pending
    setHeld(release)
  }, [active, pending, release])

  useEffect(() => {
    latestHeld.current = held
    if (held.length === 0) return

    const firstTimeout = Math.min(...held.map((entry) => entry.since)) + MAX_HOLD_MS
    const timeout = setTimeout(() => setHeld(release), Math.max(0, firstTimeout - Date.now()))
    return () => clearTimeout(timeout)
  }, [held, release])

  useEffect(() => {
    latestExecuted.current = signals.executed
    hold(pending.filter((row) => signals.executed.has(getPendingTxId(row))))
  }, [pending, signals.executed, hold])

  useEffect(() => {
    setHeld((current) => {
      const next = current.filter((entry) => !signals.failed.has(getPendingTxId(entry.policy)))
      return next.length === current.length ? current : next
    })
  }, [signals.failed])

  useEffect(() => {
    const drop = ({ txId }: { txId?: string }) => {
      if (!txId) return
      setHeld((current) => {
        const next = current.filter((entry) => getPendingTxId(entry.policy).toLowerCase() !== txId.toLowerCase())
        return next.length === current.length ? current : next
      })
    }
    const unsubscribes = [txSubscribe(TxEvent.REVERTED, drop), txSubscribe(TxEvent.FAILED, drop)]
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe())
  }, [])

  const lookUp = useCallback(
    async (row: QueuedPolicy, unlessDisproved: boolean) => {
      const key = latestKey.current
      const { data, error } = await getTransaction({ chainId: row.safe.chainId, id: getPendingTxId(row) })
      if (latestKey.current !== key) return
      // Only a 404 means the tx was deleted; any other error can't rule out execution.
      const isDeleted = !!error && 'status' in error && error.status === 404
      if (data ? data.txStatus === 'SUCCESS' : unlessDisproved && !isDeleted) hold([row])
    },
    [getTransaction, hold],
  )

  useEffect(() => {
    const gone = previous.current.filter((row) => !isListed(row, pending))
    previous.current = pending

    gone.forEach((row) => {
      if (latestHeld.current.some((entry) => keyOf(entry.policy) === keyOf(row))) return
      if (latestExecuted.current.has(getPendingTxId(row))) hold([row])
      else void lookUp(row, true)
    })
  }, [pending, hold, lookUp])

  useEffect(() => {
    if (!enabled) return
    const left = pending.filter(
      (row) => signals.leftQueue.has(getPendingTxId(row)) && !lookedUp.current.has(keyOf(row)),
    )
    if (left.length === 0) return

    left.forEach((row) => lookedUp.current.add(keyOf(row)))
    // Deleted and replaced transactions leave the queue too, and the pending policies tell those apart.
    refetch()
    left.forEach((row) => void lookUp(row, false))
  }, [enabled, pending, signals.leftQueue, refetch, lookUp])

  return useMemo(() => held.map((entry) => entry.policy), [held])
}
