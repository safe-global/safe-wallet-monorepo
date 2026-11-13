import { useMemo, type ReactElement } from 'react'
import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import ConfirmTxFlow from '@/components/tx-flow/flows/ConfirmTx'
import type ConfirmProposedTx from '@/components/tx-flow/flows/ConfirmTx/ConfirmProposedTx'
import { SafeScopeProvider } from '@/components/tx-flow/safe-scope/SafeScopeProvider'
import type { PolicyConfiguration } from '@/features/policy-guard'
import ReviewQueuedAllowlist from './ReviewQueuedAllowlist'

export type ConfirmAllowlistFlowProps = {
  chainId: string
  safeAddress: string
  txSummary: Transaction
  requestedConfigurations?: PolicyConfiguration[]
}

/** Opened from the panel of a queued allowlist transaction: the Safe is fixed, so the flow starts at review. */
const ConfirmAllowlistFlow = ({
  chainId,
  safeAddress,
  txSummary,
  requestedConfigurations,
}: ConfirmAllowlistFlowProps): ReactElement => {
  const ReviewTransactionComponent = useMemo<typeof ConfirmProposedTx>(
    () =>
      function ReviewQueuedAllowlistStep(props) {
        return <ReviewQueuedAllowlist {...props} requestedConfigurations={requestedConfigurations} />
      },
    [requestedConfigurations],
  )

  return (
    <SafeScopeProvider initial={{ chainId, safeAddress }}>
      <ConfirmTxFlow txSummary={txSummary} ReviewTransactionComponent={ReviewTransactionComponent} />
    </SafeScopeProvider>
  )
}

export default ConfirmAllowlistFlow
