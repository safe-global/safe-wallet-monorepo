import type { QueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { getStoreInstance } from '@/store'
import { getModuleTransactions, getTransactionHistory } from '@/utils/transactions'

export const getTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone

export const getTxHistory = (
  chainId: string,
  safeAddress: string,
  hideUntrustedTxs: boolean,
  hideImitationTxs: boolean,
  pageUrl?: string,
) => {
  return getTransactionHistory(
    chainId,
    safeAddress,
    {
      timezone: getTimezone(), // used for grouping txs by date
      // Untrusted and imitation txs are filtered together in the UI
      trusted: hideUntrustedTxs, // if false, include transactions marked untrusted in the UI
      imitation: !hideImitationTxs, // If true, include transactions marked imitation in the UI
    },
    pageUrl,
  )
}

/**
 * Fetch the ID of a module transaction for the given transaction hash
 */
export const getModuleTransactionId = async (chainId: string, safeAddress: string, txHash: string) => {
  const { results } = await getModuleTransactions(chainId, safeAddress, { transaction_hash: txHash })
  if (results.length === 0) throw new Error('module transaction not found')
  return results[0].transaction.id
}

export const getTransactionQueue = async (
  chainId: string,
  safeAddress: string,
  options?: { trusted?: boolean },
  pageUrl?: string,
): Promise<QueuedItemPage> => {
  const store = getStoreInstance()

  // If pageUrl is provided, parse cursor from it
  const cursor = pageUrl ? new URL(pageUrl).searchParams.get('cursor') || undefined : undefined

  const queryThunk = cgwApi.endpoints.transactionsGetTransactionQueueV1.initiate(
    {
      chainId,
      safeAddress,
      trusted: options?.trusted,
      cursor,
    },
    {
      forceRefetch: true,
    },
  )
  const queryAction = store.dispatch(queryThunk)

  try {
    return await queryAction.unwrap()
  } finally {
    queryAction.unsubscribe()
  }
}
