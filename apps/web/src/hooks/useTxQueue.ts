import type { QueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useTransactionsGetTransactionQueueV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import useAsync from '@safe-global/utils/hooks/useAsync'
import useSafeInfo from './useSafeInfo'
import { isTransactionQueuedItem } from '@/utils/transaction-guards'
import { useRecoveryQueue } from '../features/recovery/hooks/useRecoveryQueue'
import { getTransactionQueue } from '@/services/transactions'
import { POLLING_INTERVAL } from '@/config/constants'
import { isMultisigExecutionInfo } from '@/utils/transaction-guards'
import { useMemo } from 'react'

const useTxQueue = (
  pageUrl?: string,
): {
  page?: QueuedItemPage
  error?: string
  loading: boolean
} => {
  const { safe, safeAddress, safeLoaded } = useSafeInfo()
  const { chainId } = safe

  // If pageUrl is passed, load a new queue page from the API
  const [page, error, loading] = useAsync<QueuedItemPage>(() => {
    if (!pageUrl || !safeLoaded) return
    return getTransactionQueue(chainId, safeAddress, undefined, pageUrl)
  }, [chainId, safeAddress, safeLoaded, pageUrl])

  // The latest page of the queue is fetched via RTK Query
  const {
    currentData: queueData,
    error: queueError,
    isLoading: queueLoading,
  } = useTransactionsGetTransactionQueueV1Query(
    {
      chainId,
      safeAddress,
      trusted: true,
    },
    {
      skip: !safeAddress || !chainId || !!pageUrl,
      pollingInterval: POLLING_INTERVAL,
      skipPollingIfUnfocused: true,
      refetchOnFocus: true,
    },
  )

  // Return the new page or the stored page
  return pageUrl
    ? {
        page,
        error: error?.message,
        loading,
      }
    : {
        page: queueData,
        error: queueError ? (queueError as any).error || 'Failed to load queue' : undefined,
        loading: queueLoading,
      }
}

// Get the size of the queue as a string with an optional '+' if there are more pages
export const useQueuedTxsLength = (): string => {
  const { page } = useTxQueue()
  const { length } = (page?.results as Array<any>)?.filter(isTransactionQueuedItem) ?? []
  const recoveryQueueSize = useRecoveryQueue().length
  const totalSize = length + recoveryQueueSize
  if (totalSize === 0) return ''
  const hasNextPage = page?.next != null
  return `${totalSize}${hasNextPage ? '+' : ''}`
}

export const useQueuedTxByNonce = (nonce?: number) => {
  const { page } = useTxQueue()

  return useMemo(() => {
    if (!page?.results || nonce === undefined) return []

    return page.results.filter((item) => {
      if (!isTransactionQueuedItem(item)) return false
      return isMultisigExecutionInfo(item.transaction.executionInfo) && item.transaction.executionInfo.nonce === nonce
    })
  }, [page, nonce])
}

export default useTxQueue
