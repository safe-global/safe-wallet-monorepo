import React, { useMemo } from 'react'
import { Button, IconButton, Tooltip, type ButtonProps, type IconButtonProps, type SvgIconProps } from '@mui/material'
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded'
import { trackEvent } from '@/services/analytics'
import { POSITIONS_EVENTS } from '@/services/analytics/events/positions'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { logError, Errors } from '@/services/exceptions'
import { useRefetch } from '@/features/positions/hooks/useRefetch'
import css from './styles.module.css'

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
  const { refetch, shouldUsePortfolioEndpoint } = useRefetch()

  const defaultTooltip = useMemo(() => {
    return shouldUsePortfolioEndpoint ? 'Refresh portfolio data' : 'Refresh positions data'
  }, [shouldUsePortfolioEndpoint])

  const displayTooltip = tooltip ?? defaultTooltip

  const handleRefresh = async () => {
    trackEvent(POSITIONS_EVENTS.POSITIONS_REFRESH_CLICKED, {
      [MixpanelEventParams.ENTRY_POINT]: entryPoint,
    })

    try {
      await refetch()
    } catch (error) {
      logError(Errors._601, error)
    }
  }

  const isDisabled = disabled

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
        <RefreshIcon fontSize={iconButtonSize === 'small' ? 'small' : 'medium'} />
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
      startIcon={<RefreshIcon fontSize={size === 'small' ? 'small' : 'medium'} />}
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
