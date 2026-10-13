import { useTransactionsGetTransactionByIdV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import useChainId from './useChainId'
import { usePrivateQueueSpaceId } from '@/features/spaces'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

function useTxDetails(txId?: string): [TransactionDetails | undefined, Error | undefined, boolean] {
  const chainId = useChainId()
  const privateQueueSpaceId = usePrivateQueueSpaceId()

  const { currentData, error, isLoading } = useTransactionsGetTransactionByIdV1Query(
    { chainId: chainId || '', id: txId || '', spaceId: privateQueueSpaceId },
    { skip: !chainId || !txId, refetchOnMountOrArgChange: true },
  )

  return [currentData, error ? new Error(String(error)) : undefined, isLoading]
}

export default useTxDetails
