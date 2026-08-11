import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { RefreshCwIcon, type LucideProps } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { trackEvent } from '@/services/analytics'
import { POSITIONS_EVENTS } from '@/services/analytics/events/positions'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { logError, Errors } from '@/services/exceptions'
import { useRefetchBalances } from '@/hooks/useRefetchBalances'
import { cn } from '@/utils/cn'
import css from './styles.module.css'

const COOLDOWN_MS = 30_000
const MIN_LOADING_MS = 1_000

const RefreshIcon = (props: LucideProps & { isLoading?: boolean }) => {
  const { isLoading, className, ...iconProps } = props

  return <RefreshCwIcon {...iconProps} className={cn('size-4', isLoading && css.spinning, className)} />
}

type RefreshPositionsButtonProps = {
  entryPoint?: string
  tooltip?: string
  label?: string
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  className?: string
}

const RefreshPositionsButton = ({
  entryPoint = 'Positions',
  tooltip,
  size = 'small',
  label = '',
  disabled = false,
  className,
}: RefreshPositionsButtonProps) => {
  const { refetch, shouldUsePortfolioEndpoint } = useRefetchBalances()
  const [isLoading, setIsLoading] = useState(false)
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null)

  const isOnCooldown = cooldownUntil !== null && Date.now() < cooldownUntil

  useEffect(() => {
    if (!cooldownUntil) return

    const remainingTime = cooldownUntil - Date.now()
    if (remainingTime <= 0) {
      setCooldownUntil(null)
      return
    }

    const timer = setTimeout(() => {
      setCooldownUntil(null)
    }, remainingTime)

    return () => clearTimeout(timer)
  }, [cooldownUntil])

  const defaultTooltip = useMemo(() => {
    if (isOnCooldown) {
      return 'Refreshed. Please wait 30 seconds'
    }
    return shouldUsePortfolioEndpoint ? 'Refresh portfolio data' : 'Refresh positions data'
  }, [shouldUsePortfolioEndpoint, isOnCooldown])

  const displayTooltip = isOnCooldown ? defaultTooltip : (tooltip ?? defaultTooltip)

  const handleRefresh = useCallback(async () => {
    if (isLoading || isOnCooldown) return

    trackEvent(POSITIONS_EVENTS.POSITIONS_REFRESH_CLICKED, {
      [MixpanelEventParams.ENTRY_POINT]: entryPoint,
    })

    setIsLoading(true)
    const startTime = Date.now()

    try {
      await refetch()
    } catch (error) {
      logError(Errors._601, error)
    } finally {
      // Ensure minimum loading time for visual feedback
      const elapsed = Date.now() - startTime
      const remainingTime = Math.max(0, MIN_LOADING_MS - elapsed)

      setTimeout(() => {
        setIsLoading(false)
        setCooldownUntil(Date.now() + COOLDOWN_MS)
      }, remainingTime)
    }
  }, [isLoading, isOnCooldown, entryPoint, refetch])

  const isDisabled = disabled || isLoading || isOnCooldown

  if (!label) {
    const iconButtonSize = size === 'large' ? 'icon' : size === 'medium' ? 'icon-sm' : 'icon-xs'
    const iconButton = (
      <Button variant="ghost" size={iconButtonSize} onClick={handleRefresh} disabled={isDisabled} className={className}>
        <RefreshIcon isLoading={isLoading} />
      </Button>
    )

    if (!displayTooltip) {
      return iconButton
    }

    return (
      <Tooltip>
        <TooltipTrigger render={<span className="inline-flex" />}>{iconButton}</TooltipTrigger>
        <TooltipContent>{displayTooltip}</TooltipContent>
      </Tooltip>
    )
  }

  const buttonSize = size === 'large' ? 'lg' : size === 'medium' ? 'default' : 'sm'
  const button = (
    <Button variant="ghost" size={buttonSize} onClick={handleRefresh} disabled={isDisabled} className={className}>
      <RefreshIcon isLoading={isLoading} />
      {label}
    </Button>
  )

  if (!displayTooltip) {
    return button
  }

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex" />}>{button}</TooltipTrigger>
      <TooltipContent>{displayTooltip}</TooltipContent>
    </Tooltip>
  )
}

export default RefreshPositionsButton
