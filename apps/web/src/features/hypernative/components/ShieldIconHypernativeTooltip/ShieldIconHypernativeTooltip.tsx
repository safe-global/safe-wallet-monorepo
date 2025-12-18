import type { ReactElement } from 'react'
import { Box, SvgIcon, Tooltip } from '@mui/material'
import SafeShieldIcon from '@/public/images/safe-shield/safe-shield-logo-no-text.svg'
import SafeShieldLogoFull from '@/public/images/safe-shield/safe-shield-logo.svg'
import SafeShieldLogoFullDark from '@/public/images/safe-shield/safe-shield-logo-dark.svg'
import { useDarkMode } from '@/hooks/useDarkMode'

export interface ShieldIconHypernativeTooltipProps {
  iconStyles: object
}

export const ShieldIconHypernativeTooltip = ({ iconStyles }: ShieldIconHypernativeTooltipProps): ReactElement => {
  const isDarkMode = useDarkMode()

  const tooltipTitle = (
    <Box display="flex" flexDirection="column" gap={1} alignItems="flex-start" padding={1}>
      <Box display="flex" alignItems="center" gap={0.5} marginLeft={-1}>
        <SvgIcon
          component={isDarkMode ? SafeShieldLogoFull : SafeShieldLogoFullDark}
          inheritViewBox
          sx={{ fontSize: '100px', height: '20px' }}
        />
      </Box>
      <Box>Hypernative Guardian is actively monitoring this account.</Box>
    </Box>
  )

  return (
    <Tooltip
      componentsProps={{
        tooltip: {
          sx: {
            maxWidth: '230px',
          },
        },
      }}
      title={tooltipTitle}
      placement="right"
    >
      <span style={{ lineHeight: 0 }}>
        <SvgIcon component={SafeShieldIcon} inheritViewBox sx={iconStyles} />
      </span>
    </Tooltip>
  )
}

export default ShieldIconHypernativeTooltip
