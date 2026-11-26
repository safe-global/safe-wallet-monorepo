import { Typography } from '@safe-global/views/components/ui/typography'
import AllowlistChangeChip, {
  type AllowlistChangeChipProps,
} from '@safe-global/views/features/spaces/components/Policies/components/AllowlistChangeChip'
import { getPolicyLabel, getPolicySummary } from '../../utils/policyLabel'
import { getPolicyIcon } from '../../utils/policyIcon'
import type { Policy } from '../../types'

export type PolicyRuleProps = {
  policy: Policy
  /** The change an allowlist is in, tagged beside its name; unset while it is in none. */
  change?: AllowlistChangeChipProps
}

const PolicyRule = ({ policy, change }: PolicyRuleProps) => {
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

      {change && <AllowlistChangeChip {...change} />}
    </div>
  )
}

export default PolicyRule
