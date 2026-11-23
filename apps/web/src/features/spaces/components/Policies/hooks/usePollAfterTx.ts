import { useEffect, useState } from 'react'
import { txSubscribe, type TxEvent } from '@/services/tx/txEvents'

export const POLL_AFTER_TX_MS = 2 * 60_000

/** CGW caches what the policy indexer reports, and the indexer trails the chain, so one refetch can come back stale. */
export const usePollAfterTx = (events: TxEvent[], enabled: boolean): boolean => {
  const [isPolling, setIsPolling] = useState(false)

  useEffect(() => {
    if (!enabled) return
    let timeout: ReturnType<typeof setTimeout> | undefined

    const unsubscribes = events.map((event) =>
      txSubscribe(event, () => {
        setIsPolling(true)
        clearTimeout(timeout)
        timeout = setTimeout(() => setIsPolling(false), POLL_AFTER_TX_MS)
      }),
    )
    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe())
      clearTimeout(timeout)
    }
  }, [events, enabled])

  return isPolling
}
