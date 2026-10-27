import { Badge, BadgeDot } from '@safe-global/views/components/ui/badge'
import type { PolicyStatus } from '../types'

const BADGE_BY_STATUS: Record<
  PolicyStatus,
  { label: string; variant: 'success' | 'warning' | 'secondary' | 'destructive' | 'info' }
> = {
  active: { label: 'Active', variant: 'success' },
  pending: { label: 'Pending', variant: 'warning' },
  activating: { label: 'Activating', variant: 'warning' },
  // A configured module that is not enabled enforces nothing, so it is not called active.
  unenforced: { label: 'Not enforced', variant: 'secondary' },
  'not-activated': { label: 'Not activated', variant: 'destructive' },
  failed: { label: 'Failed', variant: 'destructive' },
  // Executed but still in the guard's delay: the tooltip says when it applies.
  'change-pending': { label: 'Pending', variant: 'warning' },
  'not-requested': { label: 'Not requested', variant: 'secondary' },
  'needs-signatures': { label: 'Needs signatures', variant: 'warning' },
  'ready-to-execute': { label: 'Ready to execute', variant: 'warning' },
  // Nothing to do but wait, so it does not ask for attention.
  'security-delay': { label: 'Security delay', variant: 'info' },
  'ready-to-apply': { label: 'Ready to apply', variant: 'warning' },
  expired: { label: 'Expired', variant: 'destructive' },
}

/** Status of a policy, matching the 2FA status badges on the Team table. */
const PolicyStatusChip = ({ status }: { status: PolicyStatus }) => {
  const { label, variant } = BADGE_BY_STATUS[status]

  return (
    <Badge variant={variant} size="status" shape="status" data-testid={`policy-status-${status}`}>
      <BadgeDot />
      {label}
    </Badge>
  )
}

export default PolicyStatusChip
