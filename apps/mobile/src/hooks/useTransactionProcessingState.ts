import { useAppSelector } from '@/src/store/hooks'
import { selectSigningState } from '@/src/store/signingStateSlice'
import { selectExecutingState } from '@/src/store/executingStateSlice'
import { PendingStatus, selectPendingTxById } from '@/src/store/pendingTxsSlice'

/**
 * Hook to determine if a transaction is currently being processed.
 *
 * Checks all processing states:
 * - Signing: transaction is being signed
 * - Executing: transaction is being submitted to blockchain
 * - Pending on-chain: transaction is submitted, waiting for confirmation/indexing
 *
 * @param txId - The transaction ID to check
 * @returns Object with isProcessing boolean and individual state flags
 */
export function useTransactionProcessingState(txId: string) {
  const signing = useAppSelector((state) => selectSigningState(state, txId))
  const executing = useAppSelector((state) => selectExecutingState(state, txId))
  const pendingTx = useAppSelector((state) => selectPendingTxById(state, txId))

  const isSigning = signing?.status === 'signing'
  const isExecuting = executing?.status === 'executing'
  const isPendingOnChain =
    pendingTx?.status === PendingStatus.PROCESSING || pendingTx?.status === PendingStatus.INDEXING

  return {
    isProcessing: isSigning || isExecuting || isPendingOnChain,
    isSigning,
    isExecuting,
    isPendingOnChain,
  }
}
