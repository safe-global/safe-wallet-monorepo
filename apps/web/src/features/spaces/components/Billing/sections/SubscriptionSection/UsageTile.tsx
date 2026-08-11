import { type ReactElement, type ReactNode } from 'react'
import { Box, Typography } from '@mui/material'
import { getMetricStatus } from './getUsageStatus'
import css from './styles.module.css'

const UsageTile = ({
  icon,
  label,
  used,
  total,
  format,
  testId,
  withStatusDot = false,
}: {
  icon: ReactNode
  label: string
  used: number
  total: number
  format: (value: number) => string
  testId: string
  withStatusDot?: boolean
}): ReactElement => {
  const remaining = Math.max(total - used, 0)
  const status = getMetricStatus(used, total)

  return (
    <Box className={css.tile} data-testid={testId}>
      <Box className={css.tileHeader}>
        <Box className={css.tileIcon}>{icon}</Box>
        <Typography className={css.tileLabel}>{label}</Typography>
      </Box>

      <Box className={css.tileValueRow}>
        {withStatusDot && status !== 'within_limit' && (
          <span
            className={`${css.tileDot} ${status === 'limit_reached' ? css.tileDotError : css.tileDotWarning}`}
            data-testid={`${testId}-dot`}
            aria-hidden
          />
        )}
        <span className={css.tileValue}>{format(remaining)}</span>
        <span className={css.tileTotal}>/ {format(total)}</span>
      </Box>
    </Box>
  )
}

export default UsageTile
