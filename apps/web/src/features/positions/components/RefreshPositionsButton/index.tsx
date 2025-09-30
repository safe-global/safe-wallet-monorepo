import React from 'react'
import { IconButton, Tooltip, type IconButtonProps, type SvgIconProps } from '@mui/material'
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded'
import { trackEvent } from '@/services/analytics'
import { POSITIONS_EVENTS } from '@/services/analytics/events/positions'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import usePositions from '@/features/positions/hooks/usePositions'
import useChainId from '@/hooks/useChainId'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import { useLazyPositionsGetPositionsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/positions'

const RefreshIcon = (props: SvgIconProps & { isLoading?: boolean }) => {
  const { isLoading, ...iconProps } = props

  return (
    <AutorenewRoundedIcon
      {...iconProps}
      sx={{
        ...iconProps.sx,
        ...(isLoading && {
          animation: 'spin 1s linear infinite',
          '@keyframes spin': {
            '0%': {
              transform: 'rotate(0deg)',
            },
            '100%': {
              transform: 'rotate(360deg)',
            },
          },
        }),
      }}
    />
  )
}

type RefreshPositionsButtonProps = {
  entryPoint?: string
  disabled?: boolean
  tooltip?: string
  size?: 'small' | 'medium' | 'large'
} & Omit<IconButtonProps, 'onClick' | 'disabled' | 'size'>

const RefreshPositionsButton = ({
  entryPoint = 'Positions',
  disabled = false,
  tooltip = 'Refresh positions data',
  size = 'small',
  ...iconButtonProps
}: RefreshPositionsButtonProps) => {
  const chainId = useChainId()
  const { safeAddress } = useSafeInfo()
  const currency = useAppSelector(selectCurrency)
  const { isLoading } = usePositions()
  const [triggerRefresh, { isLoading: isRefreshLoading }] = useLazyPositionsGetPositionsV1Query()

  const handleRefresh = async () => {
    if (!safeAddress || !chainId || !currency) return

    trackEvent(POSITIONS_EVENTS.POSITIONS_REFRESH_CLICKED, {
      [MixpanelEventParams.ENTRY_POINT]: entryPoint,
    })

    try {
      await triggerRefresh({ chainId, safeAddress, fiatCode: currency, refresh: true }).unwrap()
    } catch (error) {
      console.error('Failed to refresh positions:', error)
    }
  }

  const isButtonLoading = isLoading || isRefreshLoading
  const isDisabled = disabled || isButtonLoading

  const button = (
    <IconButton
      onClick={handleRefresh}
      disabled={isDisabled}
      size={size}
      {...iconButtonProps}
      sx={{
        ...iconButtonProps.sx,
        ...(isButtonLoading && {
          color: 'action.disabled',
        }),
      }}
    >
      <RefreshIcon isLoading={isButtonLoading} fontSize={size === 'small' ? 'small' : 'medium'} />
    </IconButton>
  )

  return tooltip ? (
    <Tooltip title={isDisabled ? (isButtonLoading ? 'Refreshing...' : tooltip) : tooltip} arrow>
      {isDisabled ? <span>{button}</span> : button}
    </Tooltip>
  ) : (
    button
  )
}

export default RefreshPositionsButton
