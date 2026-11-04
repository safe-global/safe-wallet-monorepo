import { useEffect } from 'react'
import { txSubscribe, type TxEvent } from '@/services/tx/txEvents'

/** RTK throws when refetching a skipped query, so the caller says when it may. */
export const useRefetchOnTxEvents = (events: TxEvent[], refetch: () => void, enabled: boolean): void => {
  useEffect(() => {
    if (!enabled) return

    const unsubscribes = events.map((event) => txSubscribe(event, () => refetch()))
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe())
  }, [events, refetch, enabled])
}
