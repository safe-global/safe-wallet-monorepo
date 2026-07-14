import { type ReactElement } from 'react'
import { type Severity } from '@safe-global/utils/features/safe-shield/types'
import { SEVERITY_COLORS } from '../constants'
import AlertIcon from '@/public/images/common/alert.svg'
import CheckIcon from '@/public/images/common/check.svg'
import InfoIcon from '@/public/images/notifications/info.svg'
import ErrorIcon from '@/public/images/common/error.svg'

const IconComponent = { CRITICAL: ErrorIcon, WARN: AlertIcon, OK: CheckIcon, INFO: InfoIcon, ERROR: AlertIcon }

export const SeverityIcon = ({
  severity,
  width = 16,
  height = 16,
  muted = false,
}: {
  severity: Severity
  width?: number
  height?: number
  muted?: boolean
}): ReactElement => {
  const color = muted ? 'var(--color-border-main)' : SEVERITY_COLORS[severity].main
  const Icon = IconComponent[severity]

  return <Icon width={width} height={height} style={{ color }} />
}
