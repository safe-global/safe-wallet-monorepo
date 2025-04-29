import { SecuritySeverity } from '@safe-global/utils/services/security/modules/types'
import CloseIcon from '@/public/images/common/close.svg'
import InfoIcon from '@/public/images/notifications/info.svg'
import type { ComponentType } from 'react'
import type { AlertColor } from '@mui/material'

const ACTION_REJECT = 'Reject this transaction'
const ACTION_REVIEW = 'Review before processing'

export type SecurityWarningProps = {
  color: AlertColor
  icon: ComponentType
  label: string
  action?: string
}

export const mapSecuritySeverity: Record<SecuritySeverity, SecurityWarningProps> = {
  [SecuritySeverity.CRITICAL]: {
    action: ACTION_REJECT,
    color: 'error',
    icon: CloseIcon,
    label: 'critical risk',
  },
  [SecuritySeverity.HIGH]: {
    action: ACTION_REJECT,
    color: 'error',
    icon: CloseIcon,
    label: 'high risk',
  },
  [SecuritySeverity.MEDIUM]: {
    action: ACTION_REVIEW,
    color: 'warning',
    icon: InfoIcon,
    label: 'warning',
  },
  [SecuritySeverity.LOW]: {
    action: ACTION_REVIEW,
    color: 'warning',
    icon: InfoIcon,
    label: 'warning',
  },
  [SecuritySeverity.NONE]: {
    color: 'info',
    icon: InfoIcon,
    label: 'info',
  },
}
