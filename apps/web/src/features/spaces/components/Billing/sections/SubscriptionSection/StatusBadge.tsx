import { type ReactElement } from 'react'
import type { UsageStatus } from '../../types'
import css from './styles.module.css'

const STATUS_CONFIG: Record<UsageStatus, { label: string; className: string }> = {
  within_limit: { label: 'Within limit', className: css.badgeSuccess },
  approaching_limit: { label: 'Approaching limit', className: css.badgeWarning },
  limit_reached: { label: 'Limit reached', className: css.badgeError },
  payment_failed: { label: 'Payment failed', className: css.badgeError },
}

const StatusBadge = ({ status }: { status: UsageStatus }): ReactElement => {
  const { label, className } = STATUS_CONFIG[status]

  return (
    <span className={`${css.badge} ${className}`} data-testid="billing-status-badge">
      <span className={css.badgeDot} aria-hidden />
      {label}
    </span>
  )
}

export default StatusBadge
