import { Chip } from '@/components/ui/chip'
import { cn } from '@/utils/cn'
import type { PolicyStatus } from '../../types'

const STATUS_CONFIG: Record<PolicyStatus, { label: string; variant: 'success' | 'warning' | 'default'; dot: string }> =
  {
    active: { label: 'Active', variant: 'success', dot: 'bg-accent-success' },
    pending: { label: 'Pending', variant: 'warning', dot: 'bg-warning' },
    // A configured module that is not enabled enforces nothing, so it is not called active.
    unenforced: { label: 'Not enforced', variant: 'default', dot: 'bg-muted-foreground' },
  }

const PolicyStatusChip = ({ status }: { status: PolicyStatus }) => {
  const { label, variant, dot } = STATUS_CONFIG[status]

  return (
    <Chip variant={variant} size="default" data-testid={`policy-status-${status}`}>
      <span className={cn('size-1.5 shrink-0 rounded-full', dot)} aria-hidden />
      {label}
    </Chip>
  )
}

export default PolicyStatusChip
