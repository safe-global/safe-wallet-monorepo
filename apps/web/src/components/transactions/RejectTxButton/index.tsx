import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Button } from '@safe-global/views/components/ui/button'

import type { ReactElement } from 'react'
import { isMultisigExecutionInfo } from '@/utils/transaction-guards'
import useIsPending from '@/hooks/useIsPending'
import Track from '@/components/common/Track'
import { TX_LIST_EVENTS } from '@/services/analytics/events/txList'
import CheckWallet from '@/components/common/CheckWallet'
import { useSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import useSetScopedTxFlow from '@/components/tx-flow/safe-scope/useSetScopedTxFlow'
import { ReplaceTxFlow } from '@/components/tx-flow/flows'

const RejectTxButton = ({
  txSummary,
  safeTxHash,
  proposer,
}: {
  txSummary: Transaction
  safeTxHash?: string
  proposer?: string
}): ReactElement | null => {
  const setTxFlow = useSetScopedTxFlow()
  const txNonce = isMultisigExecutionInfo(txSummary.executionInfo) ? txSummary.executionInfo.nonce : undefined
  const isPending = useIsPending(txSummary.id)
  const safeSDK = useSafeSDK()
  const isDisabled = isPending || !safeSDK

  const openReplacementModal = () => {
    if (txNonce === undefined) return
    setTxFlow(<ReplaceTxFlow txNonce={txNonce} safeTxHash={safeTxHash} proposer={proposer} />, undefined, false)
  }

  return (
    <CheckWallet>
      {(isOk) => (
        <Track {...TX_LIST_EVENTS.REJECT}>
          <Button
            data-testid="reject-btn"
            onClick={openReplacementModal}
            variant="destructive"
            disabled={!isOk || isDisabled}
            size="action"
          >
            Reject
          </Button>
        </Track>
      )}
    </CheckWallet>
  )
}

export default RejectTxButton
