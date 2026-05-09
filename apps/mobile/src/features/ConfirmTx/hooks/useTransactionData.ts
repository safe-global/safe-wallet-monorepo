import { useTransactionsGetTransactionByIdV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'

export const useTransactionData = (txId: string) => {
  const activeSafe = useDefinedActiveSafe()

  return useTransactionsGetTransactionByIdV1Query(
    {
      chainId: activeSafe.chainId,
      id: txId,
    },
    {
      skip: !txId || !activeSafe?.chainId,
    },
  )
}
