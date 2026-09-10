import type { PlanGroup, PlanOffer } from '../../hooks/billing/types'
import { ENTERPRISE_TIER, PLAN_FEATURES, PLAN_ORDER, PLAN_TRIAL_HIGHLIGHTS } from './fixtures'
import type { PlanSeatOption, PlanTier } from './types'

const CYCLES = ['month', 'year'] as const

export const seatsLabel = (seats: PlanOffer['seats']): string =>
  seats === null ? 'Safe accounts' : seats === 'unlimited' ? 'Unlimited Safe accounts' : `${seats} Safe accounts`

const toOption = (offer: PlanOffer, monthly: PlanOffer | undefined): PlanSeatOption => ({
  paymentLinkId: offer.paymentLinkId,
  label: seatsLabel(offer.seats),
  price: offer.price,
  originalPrice: offer.billingCycle === 'year' && monthly?.price != null ? monthly.price * 12 : null,
})

/** One tier per plan and billing cycle; a yearly option carries twelve monthly payments as its reference price. */
export const offersToTiers = (plans: PlanGroup[]): PlanTier[] =>
  plans.flatMap((plan) => {
    const monthlyBySeats = new Map(
      plan.offers.filter((offer) => offer.billingCycle === 'month').map((offer) => [String(offer.seats), offer]),
    )

    return CYCLES.flatMap((cycle) => {
      const offers = plan.offers.filter((offer) => offer.billingCycle === cycle)
      if (offers.length === 0) return []

      return [
        {
          id: `${plan.name}-${cycle}`,
          name: plan.name,
          currency: offers[0].currency,
          billingCycle: cycle,
          options: offers.map((offer) => toOption(offer, monthlyBySeats.get(String(offer.seats)))),
          features: PLAN_FEATURES[plan.name] ?? [],
          trialPeriodDays: offers[0].trialPeriodDays,
        },
      ]
    })
  })

const rank = (name: string): number => {
  const index = PLAN_ORDER.indexOf(name)
  return index === -1 ? PLAN_ORDER.length : index
}

/** The offers the CGW makes to this Workspace plus the static Enterprise card; the current plan lives in the status card. */
export const buildPlanTiers = (paidPlans: PlanGroup[]): PlanTier[] =>
  [...offersToTiers(paidPlans), ENTERPRISE_TIER].sort((a, b) => rank(a.name) - rank(b.name))

/** Monthly trial offers as selectable cards, trimmed to the two highlights the modal shows. */
export const trialTiers = (trialPlans: PlanGroup[]): PlanTier[] =>
  offersToTiers(trialPlans)
    .filter((tier) => tier.billingCycle === 'month')
    .map((tier) => ({ ...tier, features: PLAN_TRIAL_HIGHLIGHTS[tier.name] ?? tier.features.slice(0, 2) }))
    .sort((a, b) => rank(a.name) - rank(b.name))
