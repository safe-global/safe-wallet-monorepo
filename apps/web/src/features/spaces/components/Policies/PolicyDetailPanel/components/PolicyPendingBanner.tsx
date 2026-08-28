import { TriangleAlert } from 'lucide-react'
import { Typography } from '@/components/ui/typography'
import { getPendingBannerDetail, getPendingBannerTitle, type PolicyPendingState } from '../../utils/policyPendingState'
import type { PendingPolicy } from '../../types'

type PolicyPendingBannerProps = {
  policy: PendingPolicy
  state: PolicyPendingState
}

const PolicyPendingBanner = ({ policy, state }: PolicyPendingBannerProps) => {
  const detail = getPendingBannerDetail(state, policy)

  return (
    <div className="mx-4 mb-4 flex gap-2 rounded-lg bg-warning-subtle p-3" data-testid="policy-pending-banner">
      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning-strong" aria-hidden />

      <div className="flex flex-col gap-0.5">
        <Typography variant="paragraph-small" className="font-bold">
          {getPendingBannerTitle(policy, policy.operation)}
        </Typography>

        {detail && (
          <Typography variant="paragraph-small" className="text-muted-foreground">
            {detail}
          </Typography>
        )}
      </div>
    </div>
  )
}

export default PolicyPendingBanner
