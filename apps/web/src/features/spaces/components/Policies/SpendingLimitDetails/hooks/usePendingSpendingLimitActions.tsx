import { useMemo } from 'react'
import { useRouter } from 'next/router'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { AppRoutes } from '@/config/routes'
import { useChain } from '@/hooks/useChains'
import useOrigin from '@/hooks/useOrigin'
import { useUrlSpaceId } from '@/hooks/useUrlSpaceId'
import { getTxLink } from '@/utils/tx-link'
import type { PendingTxOutcome } from '../../SpendingLimitDrawer'
import type { Viewer } from '../../SpendingLimitDrawer/resolveState'
import type { PendingSpendingLimitPolicy, QueuedSpendingLimitPolicy } from '../../types'
import { getPendingTxId } from '../../utils/mapPendingPolicies'
import { usePendingPolicyTransaction } from './usePendingPolicyTransaction'

export type PendingSpendingLimitActions = {
  policy: QueuedSpendingLimitPolicy
  viewer: Viewer
  /** Undefined until the chain configs have loaded. */
  transactionLink?: string
  onReviewTransaction?: () => void
  onRetry?: () => void
  outcome?: PendingTxOutcome
}

export const usePendingSpendingLimitActions = (
  policy: PendingSpendingLimitPolicy,
  viewer: Viewer,
  isUnlisted = false,
): PendingSpendingLimitActions => {
  const { chainId, address: safeAddress } = policy.safe
  const origin = useOrigin()
  const chain = useChain(chainId)
  const router = useRouter()
  const spaceId = useUrlSpaceId()
  const { txSummary, confirmedBy, confirmationsSubmitted, outcome, onRetry } = usePendingPolicyTransaction(
    policy,
    isUnlisted,
  )
  const txId = getPendingTxId(policy)
  // An activating row was already seen executed, before its transaction has loaded.
  const resolvedOutcome = outcome ?? (policy.status === 'activating' ? 'executed' : undefined)

  const onReviewTransaction = useMemo(
    () =>
      chain && !isUnlisted
        ? () => {
            router.push(getTxLink(txId, chain, safeAddress, spaceId).href)
          }
        : undefined,
    [chain, isUnlisted, router, txId, safeAddress, spaceId],
  )

  const hasSigned = txSummary ? confirmedBy.some((signer) => sameAddress(signer, viewer.address)) : undefined

  return {
    policy: {
      ...policy,
      status: 'pending',
      confirmationsSubmitted: confirmationsSubmitted ?? policy.confirmationsSubmitted,
    },
    viewer: { ...viewer, hasSigned },
    transactionLink: chain
      ? `${origin}${AppRoutes.transactions.tx}?safe=${chain.shortName}:${safeAddress}&id=${txId}`
      : undefined,
    onReviewTransaction,
    onRetry,
    outcome: resolvedOutcome,
  }
}
