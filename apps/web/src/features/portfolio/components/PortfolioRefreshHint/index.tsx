import { useState, useEffect, useCallback } from 'react'
import { Box, IconButton, Tooltip, Typography, type SvgIconProps } from '@mui/material'
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded'
import { useRefetch } from '@/features/positions/hooks/useRefetch'
import { PORTFOLIO_CACHE_TIME_MS } from '@/config/constants'
import { trackEvent } from '@/services/analytics'
import { POSITIONS_EVENTS } from '@/services/analytics/events/positions'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { logError, Errors } from '@/services/exceptions'
import css from './styles.module.css'

const RefreshIcon = (props: SvgIconProps & { isLoading?: boolean }) => {
  const { isLoading, ...iconProps } = props
  return <AutorenewRoundedIcon {...iconProps} className={isLoading ? css.spinning : undefined} sx={iconProps.sx} />
}

const formatTimeAgo = (diffMs: number): string => {
  const diffSeconds = Math.floor(diffMs / 1000)

  if (diffSeconds < 60) {
    return 'less than 1 min'
  }
  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) {
    return `${diffMinutes} min`
  }
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''}`
  }
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} day${diffDays > 1 ? 's' : ''}`
}

interface PortfolioRefreshHintProps {
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
const PortfolioRefreshHint = ({ _fulfilledTimeStamp, _isFetching, _freezeTime }: PortfolioRefreshHintProps = {}) => {
  const { refetch, fulfilledTimeStamp: hookFulfilledTimeStamp, isFetching: hookIsFetching } = useRefetch()
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
  const timeAgo = fulfilledTimeStamp ? formatTimeAgo(timeSinceLastFetch) : null

  const handleRefresh = useCallback(async () => {
    if (isFetching || isOnCooldown) return

    trackEvent(POSITIONS_EVENTS.POSITIONS_REFRESH_CLICKED, {
      [MixpanelEventParams.ENTRY_POINT]: 'Assets',
    })

    try {
      await refetch()
    } catch (error) {
      logError(Errors._601, error)
    }
  }, [isFetching, isOnCooldown, refetch])

  const isDisabled = isFetching || isOnCooldown

  const tooltip = isOnCooldown ? (
    <>
      Next update available in{' '}
      <span className={css.time}>{Math.ceil((PORTFOLIO_CACHE_TIME_MS - timeSinceLastFetch) / 1000)}s</span>
    </>
  ) : (
    'Update portfolio data'
  )

  return (
    <Box display="flex" alignItems="center" gap={0.5}>
      <Tooltip title={tooltip} arrow>
        <span style={{ display: 'inline-flex' }}>
          <IconButton
            onClick={handleRefresh}
            disabled={isDisabled}
            size="small"
            sx={{ padding: '2px' }}
            data-testid="portfolio-refresh-button"
          >
            <RefreshIcon fontSize="small" isLoading={isFetching} />
          </IconButton>
        </span>
      </Tooltip>
      <Typography variant="caption" color="text.secondary">
        {isFetching ? 'Fetching data' : timeAgo ? <>Updated {timeAgo} ago</> : 'Loading...'}
      </Typography>
    </Box>
  )
}

export default PortfolioRefreshHint
