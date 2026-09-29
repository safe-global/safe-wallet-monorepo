import { useEffect, useRef, useState } from 'react'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { ActivePolicyDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useLazyTransactionsGetTransactionByIdV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { PendingSpendingLimitPolicy } from '../types'

const HOLD_MS = 5 * 60_000
const POLL_MS = 15_000

type Held = { policy: PendingSpendingLimitPolicy; since: number; snapshot: string }

const snapshotFor = (policy: PendingSpendingLimitPolicy, dtos: ActivePolicyDto[]): string =>
  JSON.stringify(
    dtos.find(
      (dto) =>
        dto.type === 'spending-limit' &&
        dto.safe.chainId === policy.safe.chainId &&
        sameAddress(dto.safe.address, policy.safe.address) &&
        dto.enforcement.via === 'module' &&
        policy.enforcement.via === 'module' &&
        sameAddress(dto.enforcement.moduleAddress, policy.enforcement.moduleAddress),
    ) ?? null,
  )

const isStillHeld = (entry: Held, dtos: ActivePolicyDto[]): boolean =>
  Date.now() - entry.since < HOLD_MS && snapshotFor(entry.policy, dtos) === entry.snapshot

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
  activeDtos: ActivePolicyDto[],
  { refetchActive, resetKey, enabled }: Options,
): PendingSpendingLimitPolicy[] => {
  const [held, setHeld] = useState<Held[]>([])
  const previous = useRef<PendingSpendingLimitPolicy[]>([])
  const latestDtos = useRef(activeDtos)
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
      // Still the dtos of the last render in which the row was queued: this effect runs before the ref is updated.
      const snapshot = snapshotFor(row, latestDtos.current)
      const { data, error } = await getTransaction({
        chainId: row.safe.chainId,
        id: `multisig_${row.safe.address}_${row.safeTxHash}`,
      })
      // Only a 404 means the tx was deleted; any other error can't rule out execution, so the row is held.
      if (error && 'status' in error && error.status === 404) return
      if (data && data.txStatus !== 'SUCCESS') return
      if (latestKey.current !== key) return
      if (snapshotFor(row, latestDtos.current) !== snapshot) return

      setHeld((current) =>
        current.some((entry) => entry.policy.id === row.id)
          ? current
          : [...current, { policy: { ...row, status: 'activating' }, since: Date.now(), snapshot }],
      )
    })
  }, [pending, getTransaction])

  useEffect(() => {
    latestDtos.current = activeDtos
    setHeld((current) => {
      const next = current.filter((entry) => isStillHeld(entry, activeDtos))
      return next.length === current.length ? current : next
    })
  }, [activeDtos])

  useEffect(() => {
    if (!enabled || held.length === 0) return

    const interval = setInterval(() => {
      refetchActive()
      setHeld((current) => current.filter((entry) => isStillHeld(entry, latestDtos.current)))
    }, POLL_MS)
    return () => clearInterval(interval)
  }, [enabled, held.length, refetchActive])

  return held.map((entry) => entry.policy)
}
