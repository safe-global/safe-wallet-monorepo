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
  canManage,
  onSubscribe,
  isSubscribing,
}: {
  plan: PlanSummary | null
  safeAccounts: Meter | null
  sponsoredTxs: Meter | null
  tiers: PlanTier[]
  onManage?: () => void
  isManaging?: boolean
  canManage?: boolean
  onSubscribe?: (paymentLinkId: string) => void
  isSubscribing?: boolean
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
        canManage={canManage}
      />
      <PlanCards
        tiers={tiers}
        currentBadge={plan?.status === 'trialing' ? 'Free trial' : 'Active'}
        onSubscribe={plan === null ? onSubscribe : undefined}
        isSubscribing={isSubscribing}
      />
    </div>
  )
}
