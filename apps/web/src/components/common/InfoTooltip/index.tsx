import { SvgIcon, Tooltip } from '@mui/material'
import type { SvgIconProps } from '@mui/material'
import InfoIcon from '@/public/images/notifications/info.svg'
import type { ReactNode } from 'react'

export function InfoTooltip({
  title,
  color = 'border',
  'data-testid': dataTestId,
}: {
  title: string | ReactNode
  color?: SvgIconProps['color']
  'data-testid'?: string
}) {
  return (
    <Tooltip title={title} arrow placement="top">
      <span data-testid={dataTestId}>
        <SvgIcon
          component={InfoIcon}
          inheritViewBox
          color={color}
          fontSize="small"
          sx={{
            verticalAlign: 'middle',
            ml: 0.5,
            mb: 0.25,
          }}
        />
      </span>
    </Tooltip>
  )
}
