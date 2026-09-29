import { useCallback, useRef, useState, type ComponentProps } from 'react'
import type Plans from '../index'
import PlanStatusCard from '../PlanStatusCard'
import CompareFeaturesCard from './CompareFeaturesCard'
import PlanCatalogV2 from './PlanCatalogV2'
import PlanExtrasV2 from './PlanExtrasV2'
import { canManageV2 } from './planCardsV2'
import { trackPlansV2Click } from './trackPlansV2Click'

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

export default function PlansV2({
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
}: ComponentProps<typeof Plans>) {
  const [isCompareExpanded, setCompareExpanded] = useState(false)
  const compareRef = useRef<HTMLElement>(null)
  const currentPlanName = tiers.find((tier) => tier.isCurrent)?.name

  const openCompare = useCallback(() => {
    trackPlansV2Click('compare_features')
    setCompareExpanded(true)
    // Wait a frame so the expanded rows are laid out before scrolling to the card.
    requestAnimationFrame(() => {
      const card = compareRef.current
      if (!card) return
      card.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
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
        canManage={readOnly ? false : canManageV2(canManage, currentPlan)}
        appearance="v2"
      />
      <PlanCatalogV2
        tiers={tiers}
        currentPlan={currentPlan}
        onSubscribe={onSubscribe}
        onManage={onManage}
        isBusy={isSubscribing || isManaging}
        readOnly={readOnly}
        onCompareFeatures={openCompare}
      />
      <CompareFeaturesCard
        ref={compareRef}
        currentPlan={currentPlanName}
        isExpanded={isCompareExpanded}
        onExpandedChange={setCompareExpanded}
      />
      <PlanExtrasV2 />
    </div>
  )
}
