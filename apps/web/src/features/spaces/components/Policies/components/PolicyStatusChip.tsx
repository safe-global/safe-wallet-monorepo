import { Badge, BadgeDot } from '@/components/ui/badge'
import type { PolicyStatus } from '../types'

const BADGE_BY_STATUS: Record<
  PolicyStatus,
  { label: string; variant: 'success' | 'warning' | 'secondary' | 'destructive' }
> = {
  active: { label: 'Active', variant: 'success' },
  pending: { label: 'Pending', variant: 'warning' },
  // A configured module that is not enabled enforces nothing, so it is not called active.
  unenforced: { label: 'Not enforced', variant: 'secondary' },
  'not-activated': { label: 'Not activated', variant: 'destructive' },
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
