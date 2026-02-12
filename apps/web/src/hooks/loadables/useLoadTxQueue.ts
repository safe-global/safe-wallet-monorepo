import type { QueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useEffect, useState } from 'react'
import useAsync, { type AsyncResult } from '@safe-global/utils/hooks/useAsync'
import useSafeInfo from '../useSafeInfo'
import useEffectiveSafeParams from '../useEffectiveSafeParams'
import { Errors, logError } from '@/services/exceptions'
import { TxEvent, txSubscribe } from '@/services/tx/txEvents'
import { getTransactionQueue } from '@/services/transactions'

export const useLoadTxQueue = (): AsyncResult<QueuedItemPage> => {
  const { safe, safeLoaded } = useSafeInfo()
  const { effectiveAddress, effectiveChainId } = useEffectiveSafeParams()
  const { txQueuedTag, txHistoryTag } = safe
  const [updatedTxId, setUpdatedTxId] = useState<string>('')
  // N.B. we reload when txQueuedTag/txHistoryTag/updatedTxId changes as txQueuedTag alone is not enough
  const reloadTag = (txQueuedTag ?? '') + (txHistoryTag ?? '') + updatedTxId

  // Re-fetch when chainId/address, or txQueueTag change
  const [data, error, loadingQueueItems] = useAsync<QueuedItemPage>(
    () => {
      if (!effectiveChainId || !effectiveAddress) return
      // For undeployed safes, return empty once safe info confirms not deployed
      if (safeLoaded && !safe.deployed) return Promise.resolve({ results: [] })

      return getTransactionQueue(effectiveChainId, effectiveAddress)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [effectiveChainId, effectiveAddress, reloadTag, safeLoaded, safe.deployed],
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

  return [data, error, loadingQueueItems]
}

export default useLoadTxQueue
