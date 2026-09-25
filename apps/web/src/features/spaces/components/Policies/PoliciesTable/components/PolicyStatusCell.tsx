import { Typography } from '@/components/ui/typography'
import PolicyStatusChip from '../../components/PolicyStatusChip'
import { getPolicyStatus, isPendingPolicy, type PendingPolicyOperation, type Policy } from '../../types'

const OPERATION_LABELS: Record<PendingPolicyOperation, string> = {
  create: 'New',
  update: 'Edit',
  remove: 'Removal',
}

const PolicyStatusCell = ({ policy }: { policy: Policy }) => {
  const chip = <PolicyStatusChip status={getPolicyStatus(policy)} />

  if (!isPendingPolicy(policy) || policy.status !== 'pending') return chip

  return (
    <div className="flex flex-col items-start gap-1">
      {chip}
      <Typography
        variant="paragraph-small"
        className="whitespace-nowrap text-muted-foreground"
        data-testid="policy-pending-progress"
      >
        {OPERATION_LABELS[policy.operation]} · {policy.confirmationsSubmitted} of {policy.confirmationsRequired} signed
      </Typography>
    </div>
  )
}

export default PolicyStatusCell
