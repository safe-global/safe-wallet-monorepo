import PlanCards from './PlanCards'
import PlanStatusCard from './PlanStatusCard'
import type { PlansData } from './types'

export default function Plans({ data }: { data: PlansData }) {
  return (
    <div className="flex flex-col gap-6">
      <PlanStatusCard
        plan={data.plan}
        safeAccounts={data.safeAccounts}
        sponsoredTxs={data.sponsoredTxs}
        tierName={data.tiers.find((tier) => tier.isCurrent)?.name}
      />
      <PlanCards tiers={data.tiers} currentBadge={data.plan?.status === 'trialing' ? 'Free trial' : 'Active'} />
    </div>
  )
}
