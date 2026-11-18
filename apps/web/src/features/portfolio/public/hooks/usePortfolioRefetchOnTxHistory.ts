import { useEffect, useRef } from 'react'
import { useRefetchBalances } from '@/hooks/useRefetchBalances'
import { PORTFOLIO_CACHE_TIME_MS } from '@/config/constants'
import useSafeInfo from '@/hooks/useSafeInfo'

/**
 * Hook that refetches portfolio data when txHistoryTag changes.
 * This covers both incoming and outgoing transactions.
 * Schedules the refetch after cooldown expires if still on cooldown.
 */
const usePortfolioRefetchOnTxHistory = (): void => {
  const { safe } = useSafeInfo()
  const { refetch, fulfilledTimeStamp, shouldUsePortfolioEndpoint } = useRefetchBalances()
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

    // Skip if portfolio endpoint isn't active or no successful fetch yet
    if (!shouldUsePortfolioEndpoint || !fulfilledTimeStamp) {
      return
    }

    // Clear any existing scheduled refetch
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    const now = Date.now()
    const timeSinceLastFetch = now - fulfilledTimeStamp
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
  }, [safe.txHistoryTag, refetch, fulfilledTimeStamp, shouldUsePortfolioEndpoint])
}

export default usePortfolioRefetchOnTxHistory
