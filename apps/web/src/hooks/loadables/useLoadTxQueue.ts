import type { QueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useEffect, useMemo, useState } from 'react'
import useAsync, { type AsyncResult } from '@safe-global/utils/hooks/useAsync'
import useSafeInfo from '../useSafeInfo'
import { Errors, logError } from '@/services/exceptions'
import { TxEvent, txSubscribe } from '@/services/tx/txEvents'
import { getTransactionQueue } from '@/services/transactions'
import { useSafeAddressFromUrl } from '../useSafeAddressFromUrl'
import { sameAddress } from '@safe-global/utils/utils/addresses'

export const useLoadTxQueue = (): AsyncResult<QueuedItemPage> => {
  const { safe, safeAddress, safeLoaded } = useSafeInfo()
  const safeAddressFromUrl = useSafeAddressFromUrl()
  const { chainId, txQueuedTag, txHistoryTag } = safe
  const [updatedTxId, setUpdatedTxId] = useState<string>('')
  // N.B. we reload when txQueuedTag/txHistoryTag/updatedTxId changes as txQueuedTag alone is not enough
  const reloadTag = (txQueuedTag ?? '') + (txHistoryTag ?? '') + updatedTxId

  const isSafeInfoLoading = useMemo(
    () => !!safeAddressFromUrl && (!sameAddress(safeAddressFromUrl, safeAddress) || !safeLoaded),
    [safeAddressFromUrl, safeAddress, safeLoaded],
  )

  // Re-fetch when chainId/address, or txQueueTag change
  const [data, error, loadingQueueItems] = useAsync<QueuedItemPage>(
    () => {
      if (!safeLoaded || isSafeInfoLoading) return
      if (!safe.deployed) return Promise.resolve({ results: [] })

      return getTransactionQueue(chainId, safeAddress)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [safeLoaded, chainId, safeAddress, reloadTag, safe.deployed, isSafeInfoLoading],
    false,
  )

  // Track proposed and deleted txs so that we can reload the queue
  useEffect(() => {
    const unsubscribeProposed = txSubscribe(TxEvent.PROPOSED, ({ txId }) => {
      setUpdatedTxId(txId)
    })
    const unsubscribeDeleted = txSubscribe(TxEvent.DELETED, ({ safeTxHash }) => {
      setUpdatedTxId(safeTxHash)
    })
    return () => {
      unsubscribeProposed()
      unsubscribeDeleted()
    }
  }, [])

  // Log errors
  useEffect(() => {
    if (!error) return
    logError(Errors._603, error.message)
  }, [error])

  // Prevent returning stale data when the safe info is loading after switching to a different account
  const isLoading = loadingQueueItems || isSafeInfoLoading
  const result = isLoading ? undefined : data

  return [result, error, isLoading]
}

export default useLoadTxQueue
