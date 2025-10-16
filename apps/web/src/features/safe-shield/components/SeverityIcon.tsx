import { type ReactElement } from 'react'
import { SvgIcon } from '@mui/material'
import { type Severity } from '@safe-global/utils/features/safe-shield/types'
import { SEVERITY_COLORS } from '../constants'
import AlertIcon from '@/public/images/common/alert.svg'
import CheckIcon from '@/public/images/common/check.svg'
import InfoIcon from '@/public/images/notifications/info.svg'
import ErrorIcon from '@/public/images/common/error.svg'

const IconComponent = { CRITICAL: ErrorIcon, WARN: AlertIcon, OK: CheckIcon, INFO: InfoIcon }

const getIconProps = (severity: Severity) => {
  const color = SEVERITY_COLORS[severity].main
  return {
    CRITICAL: { path: { fill: color }, rect: { fill: color } },
    WARN: { path: { fill: color } },
    OK: { path: { fill: color, stroke: color } },
    INFO: { path: { fill: color }, rect: { fill: color } },
  }[severity]
}

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
  const props = {
    sx: { ...iconProps, ...getIconProps(severity) },
    inheritViewBox: true,
    component: IconComponent[severity],
  }

  return <SvgIcon {...props} />
}
