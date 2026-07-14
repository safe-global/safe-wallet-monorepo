import { useState, useEffect, useCallback } from 'react'
import { RefreshCwIcon, type LucideProps } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import { useRefetchBalances } from '@/hooks/useRefetchBalances'
import { PORTFOLIO_CACHE_TIME_MS } from '@/config/constants'
import { trackEvent } from '@/services/analytics'
import { PORTFOLIO_EVENTS } from '@/services/analytics/events/portfolio'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { logError, Errors } from '@/services/exceptions'
import { cn } from '@/utils/cn'
import css from './styles.module.css'

const RefreshIcon = (props: LucideProps & { isLoading?: boolean }) => {
  const { isLoading, className, ...iconProps } = props
  return <RefreshCwIcon {...iconProps} className={cn('size-4', isLoading && css.spinning, className)} />
}

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

  const tooltip = isOnCooldown ? (
    <>Next update available in {Math.ceil((PORTFOLIO_CACHE_TIME_MS - timeSinceLastFetch) / 1000)}s</>
  ) : (
    'Update portfolio data'
  )

  return (
    <div className="flex items-center gap-1">
      <Typography variant="paragraph-small-bold" className="text-[var(--color-text-secondary)]">
        {isFetching ? 'Fetching data' : timeAgo ? <>Updated {timeAgo} ago</> : 'Loading...'}
      </Typography>
      <Tooltip>
        <TooltipTrigger render={<span className="inline-flex" />}>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleRefresh}
            disabled={isDisabled}
            data-testid="portfolio-refresh-button"
          >
            <RefreshIcon isLoading={isFetching} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    </div>
  )
}

export default PortfolioRefreshHint
