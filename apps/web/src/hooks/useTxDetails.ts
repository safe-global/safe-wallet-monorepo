import { useTransactionsGetTransactionByIdV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import useChainId from './useChainId'

function useTxDetails(txId?: string) {
  const chainId = useChainId()

  const { data, error, isLoading } = useTransactionsGetTransactionByIdV1Query(
    { chainId: chainId || '', id: txId || '' },
    { skip: !chainId || !txId },
  )

  return [data, error ? new Error(String(error)) : undefined, isLoading]
}

export default useTxDetails
