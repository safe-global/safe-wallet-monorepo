import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { getStoreInstance } from '@/store'

/**
 * Fetch transaction details from the gateway using RTK Query.
 * This function can be used in non-React contexts (e.g., async functions, services).
 * It dispatches the query and waits for the result.
 *
 * @param chainId - The chain ID where the transaction exists
 * @param txId - The transaction ID (safe transaction hash or multisig transaction ID)
 * @returns The transaction details
 * @throws Error if the store is not initialized or if the request fails
 */
export const getTransactionDetails = async (chainId: string, txId: string): Promise<TransactionDetails> => {
  const store = getStoreInstance()

  const result = await store
    .dispatch(
      cgwApi.endpoints.transactionsGetTransactionByIdV1.initiate(
        {
          chainId,
          id: txId,
        },
        {
          // Prevent caching in RTK Query, always fetch fresh data
          forceRefetch: true,
        },
      ),
    )
    .unwrap()

  return result
}
