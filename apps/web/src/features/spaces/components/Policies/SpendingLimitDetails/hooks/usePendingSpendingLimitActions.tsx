import type { LinkProps } from 'next/link'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { AppRoutes } from '@/config/routes'
import { useChain } from '@/hooks/useChains'
import useOrigin from '@/hooks/useOrigin'
import { useUrlSpaceId, withSpaceIdInUrl } from '@/hooks/useUrlSpaceId'
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
  reviewTransactionHref?: LinkProps['href']
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
  const spaceId = useUrlSpaceId()
  const { txSummary, confirmedBy, confirmationsSubmitted, outcome, onRetry } = usePendingPolicyTransaction(
    policy,
    isUnlisted,
  )
  const txId = getPendingTxId(policy)
  // An activating row was already seen executed, before its transaction has loaded.
  const resolvedOutcome = outcome ?? (policy.status === 'activating' ? 'executed' : undefined)

  const txPath = chain ? `${AppRoutes.transactions.tx}?safe=${chain.shortName}:${safeAddress}&id=${txId}` : undefined
  const reviewTransactionHref = txPath && !isUnlisted ? withSpaceIdInUrl(txPath, spaceId) : undefined

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
