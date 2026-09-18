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
  readOnly,
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
  /** Only admins act on the plan; everyone else sees the plans without buttons. */
  readOnly?: boolean
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
        canManage={readOnly ? false : canManage}
      />
      <PlanCards
        tiers={tiers}
        currentBadge={getCurrentBadge(plan)}
        currentPlan={currentPlan}
        onSubscribe={onSubscribe}
        onManage={onManage}
        isBusy={isSubscribing || isManaging}
        readOnly={readOnly}
      />
    </div>
  )
}
