import { useCallback, useRef, useState } from 'react'
import { SAFE_PRO_PLANS_LABELS } from '@/services/analytics/events/safe-pro'
import { PlanLocation } from '@/services/analytics/mixpanel-events'
import CompareFeaturesCard from './CompareFeaturesCard'
import type { PlanCardActions } from './PlanCard'
import { PlanCatalog } from './PlanCatalog'
import PlanStatusCard from './PlanStatusCard'
import SalesPromptCard from './SalesPromptCard'
import { trackPlansClick } from './planTiers'
import type {
  CurrentPlan,
  Meter,
  PlanPick,
  PlanSummary,
  PlanTier,
} from '@safe-global/views/features/spaces/components/Plans/types'

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
  const [isCompareExpanded, setCompareExpanded] = useState(false)
  const compareRef = useRef<HTMLElement>(null)
  const currentPlanName = tiers.find((tier) => tier.isCurrent)?.name

  const openCompare = useCallback(() => {
    trackPlansClick(SAFE_PRO_PLANS_LABELS.compare_features, PlanLocation.PLANS_PAGE)
    setCompareExpanded(true)
    // Wait a frame so the expanded rows are laid out before scrolling to the card.
    requestAnimationFrame(() => {
      const card = compareRef.current
      if (!card) return
      card.scrollIntoView({
        behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start',
      })
      card.focus({ preventScroll: true })
    })
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <PlanStatusCard
        plan={plan}
        safeAccounts={safeAccounts}
        sponsoredTxs={sponsoredTxs}
        tierName={plan?.name}
        onManage={onManage}
        isManaging={isManaging}
        canManage={!readOnly && (canManage || Boolean(currentPlan?.isTrialing && currentPlan.hasPaymentMethod))}
      />
      <PlanCatalog
        tiers={tiers}
        currentPlan={currentPlan}
        onSubscribe={onSubscribe}
        onManage={onManage}
        isBusy={isSubscribing || isManaging}
        readOnly={readOnly}
        location={PlanLocation.PLANS_PAGE}
        onCta={onCta}
        onCompareFeatures={openCompare}
      />
      <CompareFeaturesCard
        ref={compareRef}
        currentPlanName={currentPlanName}
        isExpanded={isCompareExpanded}
        onExpandedChange={setCompareExpanded}
      />
      {!readOnly && <SalesPromptCard />}
    </div>
  )
}
