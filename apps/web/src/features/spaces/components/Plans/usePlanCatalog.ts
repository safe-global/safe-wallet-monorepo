import { useMemo } from 'react'
import { buildPlanTiers, toCurrentPlan } from './planTiers'
import { useSpacePlan } from '../../hooks/useSpacePlan'
import { useSpaceOffers } from '../../hooks/billing/useSpaceOffers'

/**
 * The plan cards a Workspace can pick from: the paid offers, merged with its live plan (if any) as the current card.
 * The loading flags stay apart, since only the Plans page waits on the plan itself.
 */
export const usePlanCatalog = (spaceId: string, { withEnterprise = true }: { withEnterprise?: boolean } = {}) => {
  const { plan, seats, sponsoredTxs, subscription, isTrialing, isLoading: isPlanLoading } = useSpacePlan(spaceId)
  const { paidPlans, isLoading: isOffersLoading } = useSpaceOffers(spaceId)
  const seatsQuota = seats?.quota
  // `plan` is only set for a live subscription, the only kind a plan change applies to.
  const liveSubscription = plan ? subscription : undefined

  const currentPlan = useMemo(
    () => (liveSubscription && plan ? toCurrentPlan(liveSubscription, plan, isTrialing, seatsQuota) : undefined),
    [liveSubscription, plan, isTrialing, seatsQuota],
  )
  const tiers = useMemo(
    () =>
      buildPlanTiers(paidPlans, liveSubscription ? { subscription: liveSubscription, seatsQuota } : undefined, {
        withEnterprise,
      }),
    [paidPlans, liveSubscription, seatsQuota, withEnterprise],
  )

  return { plan, seats, sponsoredTxs, subscription, currentPlan, tiers, isPlanLoading, isOffersLoading }
}
