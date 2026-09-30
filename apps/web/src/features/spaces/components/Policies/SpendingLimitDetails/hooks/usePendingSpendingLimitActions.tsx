import { useContext, useMemo } from 'react'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { TxModalContext } from '@/components/tx-flow'
import { ConfirmTxFlow } from '@/components/tx-flow/flows'
import { SafeScopeProvider } from '@/components/tx-flow/safe-scope/SafeScopeProvider'
import { AppRoutes } from '@/config/routes'
import { useChain } from '@/hooks/useChains'
import useOrigin from '@/hooks/useOrigin'
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
  hasLeftQueue = false,
): PendingSpendingLimitActions => {
  const { chainId, address: safeAddress } = policy.safe
  const origin = useOrigin()
  const chain = useChain(chainId)
  const { setTxFlow } = useContext(TxModalContext)
  const { txSummary, confirmedBy, confirmationsSubmitted, outcome, onRetry } = usePendingPolicyTransaction(
    policy,
    hasLeftQueue,
  )
  const txId = getPendingTxId(policy)
  // An activating row was already seen executed, before its transaction has loaded.
  const resolvedOutcome = outcome ?? (policy.status === 'activating' ? 'executed' : undefined)
  // The summary may be stale until the refetch says why the row left.
  const reviewable = hasLeftQueue && !resolvedOutcome ? undefined : txSummary

  const onReviewTransaction = useMemo(
    () =>
      reviewable
        ? () =>
            setTxFlow(
              <SafeScopeProvider initial={{ chainId, safeAddress }}>
                <ConfirmTxFlow txSummary={reviewable} />
              </SafeScopeProvider>,
              undefined,
              false,
            )
        : undefined,
    [reviewable, setTxFlow, chainId, safeAddress],
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
