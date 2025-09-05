import { useTransactionData } from '@/src/features/ConfirmTx/hooks/useTransactionData'
import useSafeInfo from '@/src/hooks/useSafeInfo'
import { isMultisigDetailedExecutionInfo } from '@/src/utils/transaction-guards'

const useIsNextTx = (txId: string) => {
  const { data: txData } = useTransactionData(txId)
  const { safe } = useSafeInfo()
  const txNonce = isMultisigDetailedExecutionInfo(txData?.detailedExecutionInfo)
    ? txData?.detailedExecutionInfo.nonce
    : undefined

  return txNonce !== undefined && txNonce === safe.nonce
}

export default useIsNextTx
