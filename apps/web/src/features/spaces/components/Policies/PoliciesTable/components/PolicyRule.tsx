import { Typography } from '@/components/ui/typography'
import { getPolicyLabel, getPolicySummary } from '../../utils/policyLabel'
import { getPolicyIcon } from '../../utils/policyIcon'
import type { Policy } from '../../types'

/** The RULE cell: the policy type, and one line summarising what the policy contains. */
const PolicyRule = ({ policy }: { policy: Policy }) => {
  const Icon = getPolicyIcon(policy.type)

  return (
    <div className="flex items-center gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent">
        <Icon className="size-4 text-accent-success" aria-hidden />
      </div>

      <div className="flex min-w-0 flex-col">
        <Typography variant="paragraph-bold" className="truncate">
          {getPolicyLabel(policy)}
        </Typography>
        <Typography variant="paragraph-small" className="truncate text-muted-foreground">
          {getPolicySummary(policy)}
        </Typography>
      </div>
    </div>
  )
}

export default PolicyRule
