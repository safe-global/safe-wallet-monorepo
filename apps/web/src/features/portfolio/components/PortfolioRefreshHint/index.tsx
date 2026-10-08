import { useState, useEffect, useCallback } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { useRefetchBalances } from '@/hooks/useRefetchBalances'
import { PORTFOLIO_CACHE_TIME_MS } from '@/config/constants'
import { trackEvent } from '@/services/analytics'
import { PORTFOLIO_EVENTS } from '@/services/analytics/events/portfolio'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { logError, Errors } from '@/services/exceptions'
import { PortfolioRefreshHintView } from '@views/features/portfolio/components/PortfolioRefreshHint/PortfolioRefreshHintView'

interface PortfolioRefreshHintProps {
  /** Analytics entry point for tracking which page triggered the refresh */
  entryPoint: 'Dashboard' | 'Assets' | 'Positions'
  /** Override fulfilledTimeStamp for Storybook */
  _fulfilledTimeStamp?: number
  /** Override isFetching for Storybook */
  _isFetching?: boolean
  /** Freeze time updates for Storybook */
  _freezeTime?: boolean
}

/**
 * Component that displays when portfolio data was last updated and provides a refresh button.
 * The refresh button is disabled for PORTFOLIO_CACHE_TIME_MS (30s) after the last successful fetch.
 */
const PortfolioRefreshHint = ({
  entryPoint,
  _fulfilledTimeStamp,
  _isFetching,
  _freezeTime,
}: PortfolioRefreshHintProps) => {
  const { refetch, fulfilledTimeStamp: hookFulfilledTimeStamp, isFetching: hookIsFetching } = useRefetchBalances()
  const fulfilledTimeStamp = _fulfilledTimeStamp ?? hookFulfilledTimeStamp
  const isFetching = _isFetching ?? hookIsFetching
  const [now, setNow] = useState(Date.now)

  useEffect(() => {
    if (_freezeTime) return
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [_freezeTime])

  const timeSinceLastFetch = fulfilledTimeStamp ? now - fulfilledTimeStamp : Infinity
  const isOnCooldown = timeSinceLastFetch < PORTFOLIO_CACHE_TIME_MS
  const timeAgo = fulfilledTimeStamp ? formatDistanceToNow(fulfilledTimeStamp) : null

  const handleRefresh = useCallback(async () => {
    if (isFetching || isOnCooldown) return

    trackEvent(PORTFOLIO_EVENTS.PORTFOLIO_REFRESH_CLICKED, { [MixpanelEventParams.ENTRY_POINT]: entryPoint })

    try {
      await refetch()
    } catch (error) {
      logError(Errors._601, error)
    }
  }, [isFetching, isOnCooldown, refetch, entryPoint])

  const isDisabled = isFetching || isOnCooldown

  return (
    <PortfolioRefreshHintView
      isFetching={isFetching}
      timeAgo={timeAgo}
      cooldownSeconds={isOnCooldown ? Math.ceil((PORTFOLIO_CACHE_TIME_MS - timeSinceLastFetch) / 1000) : undefined}
      isDisabled={isDisabled}
      onRefresh={handleRefresh}
    />
  )
}

export default PortfolioRefreshHint
