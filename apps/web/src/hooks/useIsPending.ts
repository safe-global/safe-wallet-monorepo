import { useAppSelector } from '@/store'
import { PendingStatus, selectPendingTxs } from '@/store/pendingTxsSlice'

const useIsPending = (txId: string): boolean => {
  const pendingTxs = useAppSelector(selectPendingTxs)
  const pendingTx = pendingTxs[txId]

  // INDEXING status means the tx is already processed on-chain and shouldn't block execution
  if (pendingTx?.status === PendingStatus.INDEXING) {
    return false
  }

  return !!pendingTx
}

export default useIsPending
