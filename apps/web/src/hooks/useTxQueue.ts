import { getTransactionQueue, type TransactionListPage } from '@safe-global/safe-gateway-typescript-sdk'
import { useAppSelector } from '@/store'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { selectTxQueue, selectQueuedTransactionsByNonce } from '@/store/txQueueSlice'
import useSafeInfo from './useSafeInfo'
import { isTransactionListItem } from '@/utils/transaction-guards'
import { useRecoveryQueue } from '../features/recovery/hooks/useRecoveryQueue'

const useTxQueue = (
  pageUrl?: string,
): {
  page?: TransactionListPage
  error?: string
  loading: boolean
} => {
  const { safe, safeAddress, safeLoaded } = useSafeInfo()
  const { chainId } = safe

  // If pageUrl is passed, load a new queue page from the API
  const [page, error, loading] = useAsync<TransactionListPage>(() => {
    if (!pageUrl || !safeLoaded) return
    return getTransactionQueue(chainId, safeAddress, undefined, pageUrl)
  }, [chainId, safeAddress, safeLoaded, pageUrl])

  // The latest page of the queue is always in the store
  const queueState = useAppSelector(selectTxQueue)

  // Return the new page or the stored page
  return pageUrl
    ? {
        page,
        error: error?.message,
        loading,
      }
    : {
        page: queueState.data,
        error: queueState.error,
        loading: queueState.loading,
      }
}

// Get the size of the queue as a string with an optional '+' if there are more pages
export const useQueuedTxsLength = (): string => {
  const queue = useAppSelector(selectTxQueue)
  const { length } = queue.data?.results.filter(isTransactionListItem) ?? []
  const recoveryQueueSize = useRecoveryQueue().length
  const totalSize = length + recoveryQueueSize
  if (totalSize === 0) return ''
  const hasNextPage = queue.data?.next != null
  return `${totalSize}${hasNextPage ? '+' : ''}`
}

export const useQueuedTxByNonce = (nonce?: number) => {
  return useAppSelector((state) => selectQueuedTransactionsByNonce(state, nonce))
}

export default useTxQueue
