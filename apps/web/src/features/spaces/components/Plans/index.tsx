import PlanCards from './PlanCards'
import PlanStatusCard, { getCurrentBadge } from './PlanStatusCard'
import type { CurrentPlan, Meter, PlanPick, PlanSummary, PlanTier } from './types'

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
  currentPlan,
}: {
  plan: PlanSummary | null
  safeAccounts: Meter | null
  sponsoredTxs: Meter | null
  tiers: PlanTier[]
  onManage?: () => void
  isManaging?: boolean
  canManage?: boolean
  onSubscribe?: (pick: PlanPick) => void
  isSubscribing?: boolean
  currentPlan?: CurrentPlan
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
        currentBadge={getCurrentBadge(plan)}
        currentPlan={currentPlan}
        onSubscribe={onSubscribe}
        onManage={onManage}
        isBusy={isSubscribing || isManaging}
      />
    </div>
  )
}
