import { useEffect, useRef } from 'react'
import { useRefetch } from '@/features/positions/hooks/useRefetch'
import { PORTFOLIO_CACHE_TIME_MS } from '@/config/constants'
import useSafeInfo from '@/hooks/useSafeInfo'

/**
 * Hook that refetches portfolio data when txHistoryTag changes.
 * This covers both incoming and outgoing transactions.
 * Schedules the refetch after cooldown expires if still on cooldown.
 */
const usePortfolioRefetchOnTxHistory = (): void => {
  const { safe } = useSafeInfo()
  const { refetch, fulfilledTimeStamp } = useRefetch()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const prevTxHistoryTagRef = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    // Skip initial mount
    if (prevTxHistoryTagRef.current === undefined) {
      prevTxHistoryTagRef.current = safe.txHistoryTag
      return
    }

    // Skip if tag hasn't changed
    if (prevTxHistoryTagRef.current === safe.txHistoryTag) {
      return
    }

    prevTxHistoryTagRef.current = safe.txHistoryTag

    // Clear any existing scheduled refetch
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    const now = Date.now()
    const timeSinceLastFetch = fulfilledTimeStamp ? now - fulfilledTimeStamp : Infinity
    const remainingCooldown = PORTFOLIO_CACHE_TIME_MS - timeSinceLastFetch

    if (remainingCooldown > 0) {
      // Schedule refetch after cooldown expires
      timeoutRef.current = setTimeout(() => {
        refetch()
      }, remainingCooldown)
    } else {
      // Refetch immediately
      refetch()
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [safe.txHistoryTag, refetch, fulfilledTimeStamp])
}

export default usePortfolioRefetchOnTxHistory
