import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { Button, IconButton, Tooltip, type ButtonProps, type IconButtonProps, type SvgIconProps } from '@mui/material'
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded'
import { trackEvent } from '@/services/analytics'
import { POSITIONS_EVENTS } from '@/services/analytics/events/positions'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { logError, Errors } from '@/services/exceptions'
import { useRefetchBalances } from '@/hooks/useRefetchBalances'
import css from './styles.module.css'

const COOLDOWN_MS = 30_000
const MIN_LOADING_MS = 1_000

const RefreshIcon = (props: SvgIconProps & { isLoading?: boolean }) => {
  const { isLoading, ...iconProps } = props

  return <AutorenewRoundedIcon {...iconProps} className={isLoading ? css.spinning : undefined} sx={iconProps.sx} />
}

type RefreshPositionsButtonProps = {
  entryPoint?: string
  tooltip?: string
  label?: string
} & Omit<ButtonProps, 'onClick'>

const RefreshPositionsButton = ({
  entryPoint = 'Positions',
  tooltip,
  size = 'small',
  label = '',
  disabled = false,
  ...buttonProps
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
    const iconButtonSize = size === 'small' || size === 'medium' || size === 'large' ? size : 'small'
    const iconButton = (
      <IconButton
        onClick={handleRefresh}
        disabled={isDisabled}
        size={iconButtonSize}
        {...(buttonProps as Omit<IconButtonProps, 'size' | 'onClick' | 'disabled'>)}
        sx={buttonProps.sx}
      >
        <RefreshIcon fontSize={iconButtonSize === 'small' ? 'small' : 'medium'} isLoading={isLoading} />
      </IconButton>
    )

    if (!displayTooltip) {
      return iconButton
    }

    return (
      <Tooltip title={displayTooltip} arrow>
        <span style={{ display: 'inline-flex' }}>{iconButton}</span>
      </Tooltip>
    )
  }

  const button = (
    <Button
      onClick={handleRefresh}
      disabled={isDisabled}
      size={size}
      startIcon={<RefreshIcon fontSize={size === 'small' ? 'small' : 'medium'} isLoading={isLoading} />}
      {...buttonProps}
      sx={{
        ...buttonProps.sx,
        textTransform: 'none',
      }}
    >
      {label}
    </Button>
  )

  if (!displayTooltip) {
    return button
  }

  return (
    <Tooltip title={displayTooltip} arrow>
      <span style={{ display: 'inline-flex' }}>{button}</span>
    </Tooltip>
  )
}

export default RefreshPositionsButton
