import type { ReactElement } from 'react'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import type { BoxProps, TooltipProps } from '@mui/material'
import { Box, Button, SvgIcon, Tooltip } from '@mui/material'
import InfoIcon from '@/public/images/notifications/info.svg'

/**
 * The OnboardingTooltip renders a sticky Tooltip with an arrow pointing towards the wrapped component.
 * This Tooltip contains a button to hide it. This decision will be stored in the local storage such that the OnboardingTooltip will only popup until clicked away once.
 */
export const OnboardingTooltip = ({
  children,
  widgetLocalStorageId,
  text,
  initiallyShown = true,
  iconShown = true,
  titleProps = {},
  className,
  placement,
}: {
  children: ReactElement // NB: this has to be an actual HTML element, otherwise the Tooltip will not work
  widgetLocalStorageId: string
  text: string | ReactElement
  initiallyShown?: boolean
  iconShown?: boolean
  titleProps?: BoxProps
  className?: string
  placement?: TooltipProps['placement']
}): ReactElement => {
  const [widgetHidden = !initiallyShown, setWidgetHidden] = useLocalStorage<boolean>(widgetLocalStorageId)

  return widgetHidden || !text ? (
    children
  ) : (
    <Tooltip
      PopperProps={{
        className,
        disablePortal: true,
      }}
      open
      placement={placement}
      arrow
      slotProps={{
        transition: {
          timeout: { enter: 700 },
        },
      }}
      title={
        <Box display="flex" alignItems="center" gap={1} p={1} {...titleProps}>
          {iconShown && <SvgIcon component={InfoIcon} inheritViewBox fontSize="small" />}
          <div style={{ minWidth: '150px' }}>{text}</div>
          <Button
            size="small"
            color="inherit"
            variant="text"
            sx={{ whiteSpace: 'nowrap' }}
            onClick={() => setWidgetHidden(true)}
          >
            Got it
          </Button>
        </Box>
      }
    >
      {children}
    </Tooltip>
  )
}
