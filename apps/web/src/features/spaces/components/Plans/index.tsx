import PlanCards from './PlanCards'
import PlanStatusCard from './PlanStatusCard'
import type { Meter, PlanSummary, PlanTier } from './types'

export default function Plans({
  plan,
  safeAccounts,
  sponsoredTxs,
  tiers,
  onManage,
  isManaging,
}: {
  plan: PlanSummary | null
  safeAccounts: Meter | null
  sponsoredTxs: Meter | null
  tiers: PlanTier[]
  onManage?: () => void
  isManaging?: boolean
}) {
  return (
    <div className="flex flex-col gap-6">
      <PlanStatusCard
        plan={plan}
        safeAccounts={safeAccounts}
        sponsoredTxs={sponsoredTxs}
        tierName={plan?.name}
        onManage={onManage}
        isManaging={isManaging}
      />
      <PlanCards tiers={tiers} currentBadge={plan?.status === 'trialing' ? 'Free trial' : 'Active'} />
    </div>
  )
}
