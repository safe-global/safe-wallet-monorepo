import type { ReactElement, ReactNode } from 'react'
import { SvgIcon, Stack, Tooltip, Typography, type TooltipProps } from '@mui/material'
import SafeShieldLogoFull from '@/public/images/safe-shield/safe-shield-logo.svg'
import SafeShieldLogoFullDark from '@/public/images/safe-shield/safe-shield-logo-dark.svg'
import { useDarkMode } from '@/hooks/useDarkMode'

export const HypernativeTooltip = ({
  children,
  title,
  ...props
}: Omit<TooltipProps, 'title'> & { title?: ReactNode }): ReactElement => {
  const isDarkMode = useDarkMode()

  const tooltipTitle = (
    <Stack gap={1} py={1} px={0.5} maxWidth="230px">
      <SvgIcon
        // We use the inverted theme mode here so that it matches the tooltip background color
        component={isDarkMode ? SafeShieldLogoFull : SafeShieldLogoFullDark}
        inheritViewBox
        sx={{ width: 78, height: 18 }}
      />

      <Typography variant="body2">{title || 'Hypernative Guardian is actively monitoring this account.'}</Typography>
    </Stack>
  )

  return (
    <Tooltip title={tooltipTitle} arrow {...props}>
      <span style={{ display: 'flex' }}>{children}</span>
    </Tooltip>
  )
}
