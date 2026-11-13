import { useEffect, useState } from 'react'
import { POLLING_INTERVAL } from '@/config/constants'

const MAX_REREADS = 3

/** Refetches one polling interval after shouldReread turns true, at most maxRereads times per read key */
export const useCappedReread = (
  shouldReread: boolean,
  readKey: string,
  refetch: () => void,
  maxRereads = MAX_REREADS,
): void => {
  const [rereads, setRereads] = useState({ readKey, count: 0 })
  const rereadCount = rereads.readKey === readKey ? rereads.count : 0

  useEffect(() => {
    if (!shouldReread || rereadCount >= maxRereads) return
    const timer = setTimeout(() => {
      setRereads({ readKey, count: rereadCount + 1 })
      refetch()
    }, POLLING_INTERVAL)
    return () => clearTimeout(timer)
  }, [shouldReread, rereadCount, readKey, refetch, maxRereads])
}
