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

/** Executed transactions leave the queue before the indexer reports them; this keeps their row on screen meanwhile. */
export const useActivatingPolicies = (
  pending: PendingSpendingLimitPolicy[],
  activeDtos: ActivePolicyDto[],
  refetchActive: () => void,
): PendingSpendingLimitPolicy[] => {
  const [held, setHeld] = useState<Held[]>([])
  const previous = useRef<PendingSpendingLimitPolicy[]>([])
  const latestDtos = useRef(activeDtos)
  const [getTransaction] = useLazyTransactionsGetTransactionByIdV1Query()

  useEffect(() => {
    const gone = previous.current.filter((row) => !pending.some((next) => next.safeTxHash === row.safeTxHash))
    previous.current = pending

    gone.forEach(async (row) => {
      // Still the dtos of the last render in which the row was queued: this effect runs before the ref is updated.
      const snapshot = snapshotFor(row, latestDtos.current)
      const { data } = await getTransaction({
        chainId: row.safe.chainId,
        id: `multisig_${row.safe.address}_${row.safeTxHash}`,
      })
      if (data && data.txStatus !== 'SUCCESS') return
      if (snapshotFor(row, latestDtos.current) !== snapshot) return

      setHeld((current) =>
        current.some((entry) => entry.policy.safeTxHash === row.safeTxHash)
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
    if (held.length === 0) return

    const interval = setInterval(() => {
      refetchActive()
      setHeld((current) => current.filter((entry) => isStillHeld(entry, latestDtos.current)))
    }, POLL_MS)
    return () => clearInterval(interval)
  }, [held.length, refetchActive])

  return held.map((entry) => entry.policy)
}
