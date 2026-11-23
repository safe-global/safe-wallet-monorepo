import { useEffect, useMemo, useRef, useState } from 'react'
import { useLazyTransactionsGetTransactionByIdV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type {
  PendingAllowlistPolicy,
  PendingSpendingLimitPolicy,
  Policy,
} from '@safe-global/views/features/spaces/components/Policies/types'
import { getPendingTxId, isPendingChangeIndexed } from '../utils/mapPendingPolicies'
import { isAllowlistChangeServed } from '../utils/allowlistChangeServed'

const HOLD_MS = 5 * 60_000
const POLL_MS = 15_000

export type QueuedPolicy = PendingSpendingLimitPolicy | PendingAllowlistPolicy

type Held = { policy: QueuedPolicy; since: number }

const isChangeServed = (policy: QueuedPolicy, active: Policy[]): boolean =>
  policy.type === 'allowlist' ? isAllowlistChangeServed(policy, active) : isPendingChangeIndexed(policy, active)

const isStillHeld = (entry: Held, active: Policy[]): boolean =>
  Date.now() - entry.since < HOLD_MS && !isChangeServed(entry.policy, active)

const releaseHeld = (current: Held[], active: Policy[]): Held[] => {
  const next = current.filter((entry) => isStillHeld(entry, active))
  return next.length === current.length ? current : next
}

type Options = {
  refetch: () => void
  /** Held rows belong to one space; a new key drops them. */
  resetKey: string | null
  /** False while the policy queries are skipped, so there is nothing to refetch. */
  enabled: boolean
}

/**
 * Executed transactions leave the queue before the indexer reports them; this keeps their row on screen meanwhile.
 * An allowlist row keeps its id across its changes, so its transaction is told apart by its hash.
 */
export const useActivatingPolicies = (
  pending: QueuedPolicy[],
  active: Policy[],
  { refetch, resetKey, enabled }: Options,
): QueuedPolicy[] => {
  const [held, setHeld] = useState<Held[]>([])
  const previous = useRef<QueuedPolicy[]>([])
  const latestActive = useRef(active)
  const latestKey = useRef(resetKey)
  const [getTransaction] = useLazyTransactionsGetTransactionByIdV1Query()

  // Declared before the queue effect, so a space switch is not read as every row leaving the queue.
  useEffect(() => {
    latestKey.current = resetKey
    previous.current = []
    setHeld((current) => (current.length === 0 ? current : []))
  }, [resetKey])

  useEffect(() => {
    const gone = previous.current.filter(
      (row) => !pending.some((next) => next.id === row.id && next.safeTxHash === row.safeTxHash),
    )
    previous.current = pending

    gone.forEach(async (row) => {
      const key = latestKey.current
      const { data, error } = await getTransaction({
        chainId: row.safe.chainId,
        id: getPendingTxId(row),
      })
      // Only a 404 means the tx was deleted; any other error can't rule out execution, so the row is held.
      if (error && 'status' in error && error.status === 404) return
      if (data && data.txStatus !== 'SUCCESS') return
      if (latestKey.current !== key) return
      if (isChangeServed(row, latestActive.current)) return

      setHeld((current) =>
        current.some((entry) => entry.policy.id === row.id && entry.policy.safeTxHash === row.safeTxHash)
          ? current
          : [...current, { policy: { ...row, status: 'activating' }, since: Date.now() }],
      )
    })
  }, [pending, getTransaction])

  useEffect(() => {
    latestActive.current = active
    setHeld((current) => releaseHeld(current, active))
  }, [active])

  useEffect(() => {
    if (!enabled || held.length === 0) return

    const interval = setInterval(() => {
      refetch()
      setHeld((current) => releaseHeld(current, latestActive.current))
    }, POLL_MS)
    return () => clearInterval(interval)
  }, [enabled, held.length, refetch])

  return useMemo(() => held.map((entry) => entry.policy), [held])
}
