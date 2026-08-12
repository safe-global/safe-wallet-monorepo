import { type ReactElement } from 'react'
import type { BillingState } from '@/features/spaces'
import css from './styles.module.css'

const STATUS_CONFIG: Partial<Record<BillingState, { label: string; className: string }>> = {
  active: { label: 'Active', className: css.badgeSuccess },
  activating: { label: 'Activating', className: css.badgeWarning },
  payment_failed: { label: 'Payment failed', className: css.badgeError },
  canceled: { label: 'Canceled', className: css.badgeError },
}

const StatusBadge = ({ state }: { state: BillingState }): ReactElement | null => {
  const config = STATUS_CONFIG[state]
  if (!config) return null

  return (
    <span className={`${css.badge} ${config.className}`} data-testid="billing-status-badge">
      <span className={css.badgeDot} aria-hidden />
      {config.label}
    </span>
  )
}

export default StatusBadge
