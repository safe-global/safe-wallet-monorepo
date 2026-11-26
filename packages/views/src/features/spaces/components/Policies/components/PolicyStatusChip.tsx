import { Badge, BadgeDot } from '@safe-global/views/components/ui/badge'
import type { PolicyStatus } from '../types'
import type { AllowlistStatusBadge } from '../allowlistStatus'

export type PolicyStatusVariant = 'success' | 'warning' | 'info' | 'secondary' | 'destructive'

const BADGE_BY_STATUS: Record<PolicyStatus, { label: string; variant: PolicyStatusVariant }> = {
  active: { label: 'Active', variant: 'success' },
  pending: { label: 'Pending', variant: 'warning' },
  activating: { label: 'Activating', variant: 'warning' },
  // A configured module that is not enabled enforces nothing, so it is not called active.
  unenforced: { label: 'Not enforced', variant: 'secondary' },
  'not-activated': { label: 'Not activated', variant: 'destructive' },
  failed: { label: 'Failed', variant: 'destructive' },
  // Executed but still in the guard's delay: the tooltip says when it applies.
  'change-pending': { label: 'Pending', variant: 'warning' },
  // A delayed change whose apply window closed before anyone applied it.
  expired: { label: 'Expired', variant: 'destructive' },
  // An applied removal left the guard on with no rules: it blocks everything but its own removal.
  blocking: { label: 'Blocking', variant: 'destructive' },
}

export type PolicyStatusChipProps = { status: PolicyStatus } | { badge: AllowlistStatusBadge }

/** Status of a policy, matching the 2FA status badges on the Team table. */
const PolicyStatusChip = (props: PolicyStatusChipProps) => {
  const { label, variant } = 'badge' in props ? props.badge : BADGE_BY_STATUS[props.status]
  const testId = 'badge' in props ? props.badge.state : props.status

  return (
    <Badge variant={variant} size="status" shape="status" data-testid={`policy-status-${testId}`}>
      <BadgeDot />
      {label}
    </Badge>
  )
}

export default PolicyStatusChip
