import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

import type { ReactElement } from 'react'
import { useContext } from 'react'
import { isMultisigExecutionInfo } from '@/utils/transaction-guards'
import useIsPending from '@/hooks/useIsPending'
import CheckWallet from '@/components/common/CheckWallet'
import { useSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import { TxModalContext } from '@/components/tx-flow'
import { ReplaceTxFlow } from '@/components/tx-flow/flows'
import { RejectTxButtonView } from '@views/components/transactions/RejectTxButton/RejectTxButtonView'

const RejectTxButton = ({
  txSummary,
  safeTxHash,
  proposer,
}: {
  txSummary: Transaction
  safeTxHash?: string
  proposer?: string
}): ReactElement | null => {
  const { setTxFlow } = useContext(TxModalContext)
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
      {(isOk) => <RejectTxButtonView isOk={isOk} isDisabled={isDisabled} onClick={openReplacementModal} />}
    </CheckWallet>
  )
}

export default RejectTxButton
