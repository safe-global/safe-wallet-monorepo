import type { QueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useEffect, useState } from 'react'
import useAsync, { type AsyncResult } from '@safe-global/utils/hooks/useAsync'
import useSafeInfo from '../useSafeInfo'
import useEffectiveSafeParams from '../useEffectiveSafeParams'
import { Errors, logError } from '@/services/exceptions'
import { TxEvent, txSubscribe } from '@/services/tx/txEvents'
import { getTransactionQueue } from '@/services/transactions'

const useLoadTxQueue = (): AsyncResult<QueuedItemPage> => {
  const { safe, safeLoaded } = useSafeInfo()
  const { effectiveAddress, effectiveChainId } = useEffectiveSafeParams()
  const { txQueuedTag, txHistoryTag } = safe
  const [reloadCount, setReloadCount] = useState(0)
  // N.B. we reload when txQueuedTag/txHistoryTag/reloadCount changes as txQueuedTag alone is not enough
  const reloadTag = (txQueuedTag ?? '') + (txHistoryTag ?? '') + reloadCount

  // Re-fetch when chainId/address, or txQueueTag change
  const [data, error, loadingQueueItems] = useAsync<QueuedItemPage>(
    () => {
      if (!effectiveChainId || !effectiveAddress) return
      // For undeployed safes, return empty once safe info confirms not deployed
      if (safeLoaded && !safe.deployed) return Promise.resolve({ results: [] })

      return getTransactionQueue(effectiveChainId, effectiveAddress).catch((e) => {
        logError(Errors._603, e)
        throw e
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [effectiveChainId, effectiveAddress, reloadTag, safeLoaded, safe.deployed],
    false,
  )

  // Adding a confirmation does not bump txQueuedTag, so the queue must reload on the event
  useEffect(() => {
    const reload = () => setReloadCount((count) => count + 1)
    const unsubscribers = [
      txSubscribe(TxEvent.PROPOSED, reload),
      txSubscribe(TxEvent.SIGNATURE_PROPOSED, reload),
      txSubscribe(TxEvent.DELETED, reload),
    ]
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe())
  }, [])

  return [data, error, loadingQueueItems]
}

export default useLoadTxQueue
