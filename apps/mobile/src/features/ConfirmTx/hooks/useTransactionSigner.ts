import { useMemo } from 'react'
import { MultisigExecutionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useTransactionData } from '@/src/features/ConfirmTx/hooks/useTransactionData'
import { useTxSignerState } from '@/src/features/ConfirmTx/hooks/useTxSignerState'

export const useTransactionSigner = (txId: string) => {
  const { data: txDetails, isFetching, isError, error } = useTransactionData(txId)

  const detailedExecutionInfo = useMemo(() => txDetails?.detailedExecutionInfo as MultisigExecutionDetails, [txDetails])

  const signerState = useTxSignerState(detailedExecutionInfo)

  return {
    txDetails,
    detailedExecutionInfo,
    signerState,
    isLoading: isFetching,
    isError,
    error,
  }
}
