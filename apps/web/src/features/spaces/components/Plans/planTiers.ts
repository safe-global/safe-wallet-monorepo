import type { Subscription } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import type { PlanGroup, PlanOffer } from '../../hooks/billing/types'
import { ENTERPRISE_TIER, PLAN_FEATURES, PLAN_ORDER, PLAN_TRIAL_HIGHLIGHTS } from './fixtures'
import type { PlanSeatOption, PlanTier } from './types'

const CYCLES = ['month', 'year'] as const

export const seatsLabel = (seats: PlanOffer['seats'] | undefined): string =>
  seats === undefined || seats === null
    ? 'Safe accounts'
    : seats === 'unlimited'
      ? 'Unlimited Safe accounts'
      : `${seats} Safe accounts`

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

/** The CGW never offers the current plan, so its card is rebuilt from the subscription and the seats entitlement. */
export const subscriptionToTier = (subscription: Subscription, seatsQuota: number | null | undefined): PlanTier => {
  const name = subscription.plan.name ?? 'Safe Pro'

  return {
    id: 'current',
    name,
    currency: subscription.plan.currency,
    billingCycle: subscription.plan.billingCycle ?? null,
    options: [
      {
        paymentLinkId: null,
        label: seatsLabel(seatsQuota === null ? 'unlimited' : seatsQuota),
        price: subscription.plan.currentPrice,
        originalPrice: subscription.plan.originalPrice,
      },
    ],
    features: subscription.plan.features.length > 0 ? subscription.plan.features : (PLAN_FEATURES[name] ?? []),
    isCurrent: true,
  }
}

const rank = (name: string): number => {
  const index = PLAN_ORDER.indexOf(name)
  return index === -1 ? PLAN_ORDER.length : index
}

export const buildPlanTiers = ({
  paidPlans,
  subscription,
  seatsQuota,
}: {
  paidPlans: PlanGroup[]
  subscription: Subscription | undefined
  seatsQuota: number | null | undefined
}): PlanTier[] => {
  const tiers = offersToTiers(paidPlans)
  if (subscription) tiers.push(subscriptionToTier(subscription, seatsQuota))
  tiers.push(ENTERPRISE_TIER)

  return tiers.sort((a, b) => rank(a.name) - rank(b.name))
}

/** Monthly trial offers as selectable cards, trimmed to the two highlights the modal shows. */
export const trialTiers = (trialPlans: PlanGroup[]): PlanTier[] =>
  offersToTiers(trialPlans)
    .filter((tier) => tier.billingCycle === 'month')
    .map((tier) => ({ ...tier, features: PLAN_TRIAL_HIGHLIGHTS[tier.name] ?? tier.features.slice(0, 2) }))
    .sort((a, b) => rank(a.name) - rank(b.name))
