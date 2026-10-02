import { useMemo } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import {
  useTransactionsGetTransactionQueueV1Query,
  type QueuedItemPage,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useAppSelector } from '@/store'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { POLLING_INTERVAL } from '@/config/constants'
import { useSafeScopeContext } from '@/components/tx-flow/safe-scope/context'
import { selectTxQueue, selectQueuedTransactionsByNonce, filterQueuedTransactionsByNonce } from '@/store/txQueueSlice'
import useSafeInfo from './useSafeInfo'
import { isTransactionQueuedItem } from '@/utils/transaction-guards'
import { useRecoveryQueue } from '../features/recovery/hooks/useRecoveryQueue'
import { getTransactionQueue } from '@/services/transactions'

// The Redux queue belongs to the route's Safe, so a Space-level flow fetches its scoped Safe's first page instead.
const useScopedTxQueue = () => {
  const scopeContext = useSafeScopeContext()
  const scope = scopeContext?.scope
  const { currentData, error, isLoading } = useTransactionsGetTransactionQueueV1Query(
    scope ? { chainId: scope.chainId, safeAddress: scope.safeAddress } : skipToken,
    { pollingInterval: POLLING_INTERVAL },
  )

  return {
    isScoped: scopeContext !== undefined,
    page: currentData,
    error: error ? ('message' in error ? String(error.message) : 'Failed to load transaction queue') : undefined,
    loading: isLoading,
  }
}

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

  // The latest page of the queue is always in the store
  const queueState = useAppSelector(selectTxQueue)
  const scopedQueue = useScopedTxQueue()

  if (pageUrl) {
    return { page, error: error?.message, loading }
  }

  if (scopedQueue.isScoped) {
    return { page: scopedQueue.page, error: scopedQueue.error, loading: scopedQueue.loading }
  }

  return { page: queueState.data, error: queueState.error, loading: queueState.loading }
}

// Get the size of the queue as a string with an optional '+' if there are more pages
export const useQueuedTxsLength = (): string => {
  const queue = useAppSelector(selectTxQueue)
  const { length } = (queue.data?.results as Array<any>)?.filter(isTransactionQueuedItem) ?? []
  const recoveryQueueSize = useRecoveryQueue().length
  const totalSize = length + recoveryQueueSize
  if (totalSize === 0) return ''
  const hasNextPage = queue.data?.next != null
  return `${totalSize}${hasNextPage ? '+' : ''}`
}

export const useQueuedTxByNonce = (nonce?: number) => {
  const storedTxs = useAppSelector((state) => selectQueuedTransactionsByNonce(state, nonce))
  const { isScoped, page } = useScopedTxQueue()
  const scopedTxs = useMemo(() => filterQueuedTransactionsByNonce(page, nonce), [page, nonce])

  return isScoped ? scopedTxs : storedTxs
}

export default useTxQueue
