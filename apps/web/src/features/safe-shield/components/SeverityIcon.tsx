import { type ReactElement } from 'react'
import { SvgIcon } from '@mui/material'
import { type Severity } from '@safe-global/utils/features/safe-shield/types'
import { SEVERITY_COLORS } from '../constants'
import AlertIcon from '@/public/images/common/alert.svg'
import CheckIcon from '@/public/images/common/check.svg'
import InfoIcon from '@/public/images/notifications/info.svg'
import ErrorIcon from '@/public/images/common/error.svg'

export const SeverityIcon = ({
  severity,
  width = 16,
  height = 16,
}: {
  severity: Severity
  width?: number
  height?: number
}): ReactElement => {
  const iconProps = { width, height }
  const color = SEVERITY_COLORS[severity].main

  switch (severity) {
    case 'CRITICAL':
      return (
        <SvgIcon
          sx={{ ...iconProps, path: { fill: color }, rect: { fill: color } }}
          component={ErrorIcon}
          inheritViewBox
        />
      )
    case 'WARN':
      return <SvgIcon sx={{ ...iconProps, path: { fill: color } }} component={AlertIcon} inheritViewBox />
    case 'OK':
      return (
        <SvgIcon sx={{ ...iconProps, path: { fill: color, stroke: color } }} component={CheckIcon} inheritViewBox />
      )
    default:
      return (
        <SvgIcon
          sx={{ ...iconProps, path: { fill: color }, rect: { fill: color } }}
          component={InfoIcon}
          inheritViewBox
        />
      )
  }
}
