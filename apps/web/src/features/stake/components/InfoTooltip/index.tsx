import { SvgIcon, Tooltip } from '@mui/material'
import InfoIcon from '@/public/images/notifications/info.svg'
import type { ReactNode } from 'react'

export function InfoTooltip({
  title,
  'data-testid': dataTestId,
}: {
  title: string | ReactNode
  'data-testid'?: string
}) {
  return (
    <Tooltip title={title} arrow placement="top">
      <span data-testid={dataTestId}>
        <SvgIcon
          component={InfoIcon}
          inheritViewBox
          color="border"
          fontSize="small"
          sx={{
            verticalAlign: 'middle',
            ml: 0.5,
          }}
        />
      </span>
    </Tooltip>
  )
}
