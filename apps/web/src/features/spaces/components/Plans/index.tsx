import { PlanLocation } from '@/services/analytics/mixpanel-events'
import PlanCards, { type PlanCardActions } from './PlanCards'
import PlanStatusCard, { getCurrentBadge } from './PlanStatusCard'
import type { CurrentPlan, Meter, PlanPick, PlanSummary, PlanTier } from '@views/features/spaces/components/Plans/types'
import { PlansView } from '@views/features/spaces/components/Plans/PlansView'

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
  onCta,
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
} & Pick<PlanCardActions, 'onCta'>) {
  return (
    <PlansView
      statusCard={
        <PlanStatusCard
          plan={plan}
          safeAccounts={safeAccounts}
          sponsoredTxs={sponsoredTxs}
          tierName={plan?.name}
          onManage={onManage}
          isManaging={isManaging}
          canManage={readOnly ? false : canManage}
        />
      }
      planCards={
        <PlanCards
          tiers={tiers}
          currentBadge={getCurrentBadge(plan)}
          currentPlan={currentPlan}
          onSubscribe={onSubscribe}
          onManage={onManage}
          isBusy={isSubscribing || isManaging}
          readOnly={readOnly}
          location={PlanLocation.PLANS_PAGE}
          onCta={onCta}
        />
      }
    />
  )
}
