import { cgwApi, TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { store } from '@/src/store'

/**
 * Fetches transaction details from the Safe Gateway API using RTK Query
 * @param chainId - The chain ID
 * @param txId - The transaction ID
 * @returns Transaction details
 */
export const fetchTransactionDetails = async (chainId: string, txId: string): Promise<TransactionDetails> => {
  return store
    .dispatch(
      cgwApi.endpoints.transactionsGetTransactionByIdV1.initiate(
        {
          chainId,
          id: txId,
        },
        { forceRefetch: true },
      ),
    )
    .unwrap()
}
