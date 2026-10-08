import React, { useState, useEffect, useCallback } from 'react'
import { trackEvent } from '@/services/analytics'
import { POSITIONS_EVENTS } from '@/services/analytics/events/positions'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { logError, Errors } from '@/services/exceptions'
import { useRefetchBalances } from '@/hooks/useRefetchBalances'
import { RefreshPositionsButtonView } from '@views/features/positions/components/RefreshPositionsButton/RefreshPositionsButtonView'

const COOLDOWN_MS = 30_000
const MIN_LOADING_MS = 1_000

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

  return (
    <RefreshPositionsButtonView
      tooltip={tooltip}
      label={label}
      size={size}
      buttonClassName={className}
      isLoading={isLoading}
      isOnCooldown={isOnCooldown}
      isDisabled={isDisabled}
      shouldUsePortfolioEndpoint={shouldUsePortfolioEndpoint}
      onRefresh={handleRefresh}
    />
  )
}

export default RefreshPositionsButton
