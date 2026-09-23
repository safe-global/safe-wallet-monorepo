import { useCallback, useMemo, useState } from 'react'
import { trackEvent } from '@/services/analytics'
import { POLICY_EVENTS } from '@/services/analytics/events/policies'
import { useChangePlan } from '../../../hooks/billing/useChangePlan'
import { useSpaceOffers } from '../../../hooks/billing/useSpaceOffers'
import { useSpacePlan } from '../../../hooks/useSpacePlan'
import { RECOMMENDED_PLAN } from '../../Plans/fixtures'
import { buildPlanTiers, toCurrentPlan } from '../../Plans/planTiers'
import type { CurrentPlan, PlanPick, PlanSeatOption, PlanTier } from '../../Plans/types'

const bySeats = (a: PlanSeatOption, b: PlanSeatOption): number =>
  (a.seats ?? Number.POSITIVE_INFINITY) - (b.seats ?? Number.POSITIVE_INFINITY)

/** The offered Business tier, monthly when it has one, with the smallest option that still fits every Safe account. */
export const pickUpgrade = (tiers: PlanTier[], safeCount: number): PlanPick | undefined => {
  const offered = tiers.filter((tier) => tier.name === RECOMMENDED_PLAN && !tier.isCurrent)
  const tier = offered.find((candidate) => candidate.billingCycle === 'month') ?? offered[0]
  if (!tier) return undefined

  const options = tier.options.filter((option) => option.paymentLinkId).sort(bySeats)
  const option =
    options.find((candidate) => (candidate.seats ?? Number.POSITIVE_INFINITY) >= safeCount) ??
    options[options.length - 1]

  return option ? { tier, option } : undefined
}

/**
 * The plan-change flow towards Business, opened as the Plans page opens it. `pick` and `currentPlan` are
 * undefined while the offers are not in or the plan cannot be changed.
 */
export const usePolicyUpgrade = (spaceId: string) => {
  const [isOpen, setIsOpen] = useState(false)
  const { plan, subscription, isTrialing, seats } = useSpacePlan(spaceId)
  const { paidPlans } = useSpaceOffers(spaceId)
  const { canChange } = useChangePlan(spaceId)

  const currentPlan = useMemo<CurrentPlan | undefined>(
    () => (canChange && subscription && plan ? toCurrentPlan(subscription, plan, isTrialing, seats?.quota) : undefined),
    [canChange, subscription, plan, isTrialing, seats?.quota],
  )

  const pick = useMemo(() => {
    if (!currentPlan || !subscription) return undefined
    return pickUpgrade(buildPlanTiers(paidPlans, { subscription, seatsQuota: seats?.quota }), seats?.used ?? 0)
  }, [currentPlan, subscription, paidPlans, seats?.quota, seats?.used])

  const open = useCallback(() => {
    trackEvent(POLICY_EVENTS.POLICY_UPGRADE_CLICKED)
    setIsOpen(true)
  }, [])
  const close = useCallback(() => setIsOpen(false), [])

  return { pick, currentPlan, isOpen, open, close }
}
