import type { LinkProps } from 'next/link'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { AppRoutes } from '@/config/routes'
import { useChain } from '@/hooks/useChains'
import useOrigin from '@/hooks/useOrigin'
import { useUrlSpaceId, withSpaceIdInUrl } from '@/hooks/useUrlSpaceId'
import type { PendingTxOutcome } from '../../SpendingLimitDrawer'
import type { Viewer } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitDrawer/resolveState'
import type {
  PendingAllowlistPolicy,
  PendingSpendingLimitPolicy,
  QueuedSpendingLimitPolicy,
} from '@safe-global/views/features/spaces/components/Policies/types'
import { getPendingTxId } from '../../utils/mapPendingPolicies'
import { usePendingPolicyTransaction } from './usePendingPolicyTransaction'

export type PendingPolicyActions<T extends PendingSpendingLimitPolicy | PendingAllowlistPolicy> = {
  policy: T & { status: 'pending' }
  viewer: Viewer
  /** Undefined until the chain configs have loaded. */
  transactionLink?: string
  reviewTransactionHref?: LinkProps['href']
  onRetry?: () => void
  outcome?: PendingTxOutcome
}

export type PendingSpendingLimitActions = PendingPolicyActions<PendingSpendingLimitPolicy> & {
  policy: QueuedSpendingLimitPolicy
}

/** The queued transaction's links and fresh signatures, for any policy drawer that recycles the pending panel. */
export const usePendingPolicyActions = <T extends PendingSpendingLimitPolicy | PendingAllowlistPolicy>(
  policy: T,
  viewer: Viewer,
  isUnlisted = false,
): PendingPolicyActions<T> => {
  const { chainId, address: safeAddress } = policy.safe
  const origin = useOrigin()
  const chain = useChain(chainId)
  const spaceId = useUrlSpaceId()
  const { txSummary, confirmedBy, confirmationsSubmitted, outcome, onRetry } = usePendingPolicyTransaction(
    policy,
    isUnlisted,
  )
  const txId = getPendingTxId(policy)
  // An activating row was already seen executed, before its transaction has loaded.
  const resolvedOutcome = outcome ?? (policy.status === 'activating' ? 'executed' : undefined)

  const txPath = chain ? `${AppRoutes.transactions.tx}?safe=${chain.shortName}:${safeAddress}&id=${txId}` : undefined
  // Held until the transaction loads, so a signer who already signed is never offered Review.
  const reviewTransactionHref = txPath && txSummary && !isUnlisted ? withSpaceIdInUrl(txPath, spaceId) : undefined

  const hasSigned = txSummary ? confirmedBy.some((signer) => sameAddress(signer, viewer.address)) : undefined

  return {
    policy: {
      ...policy,
      status: 'pending',
      confirmationsSubmitted: confirmationsSubmitted ?? policy.confirmationsSubmitted,
    },
    viewer: { ...viewer, hasSigned },
    // Shared links leave the Space out on purpose: their recipient may not be a member of it.
    transactionLink: txPath ? `${origin}${txPath}` : undefined,
    reviewTransactionHref,
    onRetry,
    outcome: resolvedOutcome,
  }
}

export const usePendingSpendingLimitActions = (
  policy: PendingSpendingLimitPolicy,
  viewer: Viewer,
  isUnlisted = false,
): PendingSpendingLimitActions => usePendingPolicyActions(policy, viewer, isUnlisted)
