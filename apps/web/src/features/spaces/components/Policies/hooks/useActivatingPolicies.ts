import { useEffect, useMemo, useRef, useState } from 'react'
import { useLazyTransactionsGetTransactionByIdV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { PendingSpendingLimitPolicy, Policy } from '../types'
import { isPendingChangeIndexed } from '../utils/mapPendingPolicies'

const HOLD_MS = 5 * 60_000
const POLL_MS = 15_000

type Held = { policy: PendingSpendingLimitPolicy; since: number }

const isStillHeld = (entry: Held, active: Policy[]): boolean =>
  Date.now() - entry.since < HOLD_MS && !isPendingChangeIndexed(entry.policy, active)

const releaseHeld = (current: Held[], active: Policy[]): Held[] => {
  const next = current.filter((entry) => isStillHeld(entry, active))
  return next.length === current.length ? current : next
}

type Options = {
  refetchActive: () => void
  /** Held rows belong to one space; a new key drops them. */
  resetKey: string | null
  /** False while the policy queries are skipped, so there is nothing to refetch. */
  enabled: boolean
}

/** Executed transactions leave the queue before the indexer reports them; this keeps their row on screen meanwhile. */
export const useActivatingPolicies = (
  pending: PendingSpendingLimitPolicy[],
  active: Policy[],
  { refetchActive, resetKey, enabled }: Options,
): PendingSpendingLimitPolicy[] => {
  const [held, setHeld] = useState<Held[]>([])
  const previous = useRef<PendingSpendingLimitPolicy[]>([])
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
    const gone = previous.current.filter((row) => !pending.some((next) => next.id === row.id))
    previous.current = pending

    gone.forEach(async (row) => {
      const key = latestKey.current
      const { data, error } = await getTransaction({
        chainId: row.safe.chainId,
        id: `multisig_${row.safe.address}_${row.safeTxHash}`,
      })
      // Only a 404 means the tx was deleted; any other error can't rule out execution, so the row is held.
      if (error && 'status' in error && error.status === 404) return
      if (data && data.txStatus !== 'SUCCESS') return
      if (latestKey.current !== key) return
      if (isPendingChangeIndexed(row, latestActive.current)) return

      setHeld((current) =>
        current.some((entry) => entry.policy.id === row.id)
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
      refetchActive()
      setHeld((current) => releaseHeld(current, latestActive.current))
    }, POLL_MS)
    return () => clearInterval(interval)
  }, [enabled, held.length, refetchActive])

  return useMemo(() => held.map((entry) => entry.policy), [held])
}
