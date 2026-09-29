import { useContext, useMemo } from 'react'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { getEip3770ShortName } from '@safe-global/utils/utils/chains'
import { TxModalContext } from '@/components/tx-flow'
import { ConfirmTxFlow } from '@/components/tx-flow/flows'
import { SafeScopeProvider } from '@/components/tx-flow/safe-scope/SafeScopeProvider'
import { AppRoutes } from '@/config/routes'
import useOrigin from '@/hooks/useOrigin'
import type { PendingTxOutcome } from '../../SpendingLimitDrawer'
import type { Viewer } from '../../SpendingLimitDrawer/resolveState'
import type { QueuedSpendingLimitPolicy } from '../../types'
import { getPendingTxId } from '../../utils/mapPendingPolicies'
import { usePendingPolicyTransaction } from './usePendingPolicyTransaction'

export type PendingSpendingLimitActions = {
  policy: QueuedSpendingLimitPolicy
  viewer: Viewer
  transactionLink: string
  onReviewTransaction?: () => void
  outcome?: PendingTxOutcome
}

export const usePendingSpendingLimitActions = (
  policy: QueuedSpendingLimitPolicy,
  viewer: Viewer,
): PendingSpendingLimitActions => {
  const { chainId, address: safeAddress } = policy.safe
  const origin = useOrigin()
  const { setTxFlow } = useContext(TxModalContext)
  const { txSummary, confirmedBy, confirmationsSubmitted, outcome } = usePendingPolicyTransaction(policy)
  const txId = getPendingTxId(policy)

  const onReviewTransaction = useMemo(
    () =>
      txSummary
        ? () =>
            setTxFlow(
              <SafeScopeProvider initial={{ chainId, safeAddress }}>
                <ConfirmTxFlow txSummary={txSummary} />
              </SafeScopeProvider>,
              undefined,
              false,
            )
        : undefined,
    [txSummary, setTxFlow, chainId, safeAddress],
  )

  const hasSigned = confirmedBy.some((signer) => sameAddress(signer, viewer.address))

  return {
    policy: { ...policy, confirmationsSubmitted: confirmationsSubmitted ?? policy.confirmationsSubmitted },
    viewer: { ...viewer, hasSigned },
    transactionLink: `${origin}${AppRoutes.transactions.tx}?safe=${getEip3770ShortName(chainId)}:${safeAddress}&id=${txId}`,
    onReviewTransaction,
    outcome,
  }
}
