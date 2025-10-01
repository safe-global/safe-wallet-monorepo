import React from 'react'
import { Button, Tooltip, type ButtonProps, type SvgIconProps } from '@mui/material'
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded'
import { trackEvent } from '@/services/analytics'
import { POSITIONS_EVENTS } from '@/services/analytics/events/positions'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { logError, Errors } from '@/services/exceptions'
import usePositions from '@/features/positions/hooks/usePositions'

const RefreshIcon = (props: SvgIconProps & { isLoading?: boolean }) => {
  const { isLoading, ...iconProps } = props

  return (
    <AutorenewRoundedIcon
      {...iconProps}
      sx={{
        ...iconProps.sx,
        '@keyframes spin': {
          '0%': {
            transform: 'rotate(0deg)',
          },
          '100%': {
            transform: 'rotate(360deg)',
          },
        },
        animation: isLoading ? 'spin 1s linear' : 'none',
      }}
    />
  )
}

type RefreshPositionsButtonProps = {
  entryPoint?: string
  tooltip?: string
  label?: string
} & Omit<ButtonProps, 'onClick'>

const RefreshPositionsButton = ({
  entryPoint = 'Positions',
  tooltip = 'Refresh positions data',
  size = 'small',
  label = '',
  disabled = false,
  ...buttonProps
}: RefreshPositionsButtonProps) => {
  const { refetch, isLoading } = usePositions()

  const handleRefresh = async () => {
    trackEvent(POSITIONS_EVENTS.POSITIONS_REFRESH_CLICKED, {
      [MixpanelEventParams.ENTRY_POINT]: entryPoint,
    })

    try {
      await refetch()
    } catch (error) {
      logError(Errors._605, error)
    }
  }

  const isDisabled = disabled || isLoading

  const button = (
    <Button
      onClick={handleRefresh}
      disabled={isDisabled}
      size={size}
      startIcon={<RefreshIcon isLoading={isLoading} fontSize={size === 'small' ? 'small' : 'medium'} />}
      {...buttonProps}
      sx={{
        ...buttonProps.sx,
        textTransform: 'none',
        ...(isLoading && {
          color: 'action.disabled',
        }),
      }}
    >
      {label}
    </Button>
  )

  return tooltip ? (
    <Tooltip title={isDisabled ? (isLoading ? 'Refreshing...' : tooltip) : tooltip} arrow>
      {isDisabled ? <span>{button}</span> : button}
    </Tooltip>
  ) : (
    button
  )
}

export default RefreshPositionsButton
