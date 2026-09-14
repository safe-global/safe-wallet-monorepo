import type { Subscription } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import type { PlanGroup, PlanOffer } from '../../hooks/billing/types'
import { ENTERPRISE_TIER, PLAN_CLAIM_HIGHLIGHTS, PLAN_FEATURES, PLAN_ORDER, PLAN_TRIAL_HIGHLIGHTS } from './fixtures'
import type { CurrentPlan, PlanChangeDirection, PlanCta, PlanPick, PlanSeatOption, PlanTier } from './types'

const CYCLES = ['month', 'year'] as const

export const formatPlanPrice = (price: number, currency: string): string =>
  new Intl.NumberFormat('en', { style: 'currency', currency, maximumFractionDigits: 0 }).format(price)

export const priceSuffix = (billingCycle: 'month' | 'year' | null): string => (billingCycle === 'year' ? '/yr' : '/mo')

const monthlyEquivalent = (price: number, billingCycle: 'month' | 'year' | null): number =>
  billingCycle === 'year' ? price / 12 : price

/** Compares monthly-equivalent prices, so a yearly plan is not read as a 12x upgrade. */
export const getChangeDirection = (current: CurrentPlan | undefined, pick: PlanPick): PlanChangeDirection => {
  if (!current || pick.option.price === null) return 'change'
  const next = monthlyEquivalent(pick.option.price, pick.tier.billingCycle)
  const now = monthlyEquivalent(current.price, current.billingCycle)
  return next > now ? 'upgrade' : next < now ? 'downgrade' : 'change'
}

/**
 * The button a catalog card shows, given the Workspace's live plan (if any). Without one, `recommended` names the
 * plan that gets the primary "Continue with" button while the others read as a switch.
 */
export const getPlanCta = (pick: PlanPick, current: CurrentPlan | undefined, recommended?: string): PlanCta => {
  if (pick.tier.isCurrent) {
    return current?.isTrialing
      ? { kind: 'billing', label: 'Add billing details' }
      : { kind: 'manage', label: 'Manage plan' }
  }
  if (!pick.option.paymentLinkId) return { kind: 'sales', label: 'Talk to sales' }
  if (!current) {
    return recommended && pick.tier.name !== recommended
      ? { kind: 'change', direction: 'change', label: `Switch to ${pick.tier.name}` }
      : { kind: 'subscribe', label: `Continue with ${pick.tier.name}` }
  }

  const direction = getChangeDirection(current, pick)
  return {
    kind: 'change',
    direction,
    label: direction === 'upgrade' ? `Upgrade to ${pick.tier.name}` : `Switch to ${pick.tier.name}`,
  }
}

export const seatsLabel = (seats: PlanOffer['seats']): string =>
  seats === null ? 'Safe accounts' : seats === 'unlimited' ? 'Unlimited Safe accounts' : `${seats} Safe accounts`

const toOption = (offer: PlanOffer, monthly: PlanOffer | undefined): PlanSeatOption => ({
  paymentLinkId: offer.paymentLinkId,
  priceId: offer.priceId,
  label: seatsLabel(offer.seats),
  seats: typeof offer.seats === 'number' ? offer.seats : null,
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
        priceId: subscription.plan.id,
        label: seatsLabel(seatsQuota === undefined ? null : seatsQuota === null ? 'unlimited' : seatsQuota),
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

/** The offered plans, the current one (when live) and the static Enterprise card, in catalog order. */
export const buildPlanTiers = (
  paidPlans: PlanGroup[],
  current?: { subscription: Subscription; seatsQuota: number | null | undefined },
): PlanTier[] =>
  [
    ...offersToTiers(paidPlans),
    ...(current ? [subscriptionToTier(current.subscription, current.seatsQuota)] : []),
    ENTERPRISE_TIER,
  ].sort((a, b) => rank(a.name) - rank(b.name))

/** Monthly trial offers as selectable cards, trimmed to the two highlights the modal shows. */
export const trialTiers = (trialPlans: PlanGroup[]): PlanTier[] =>
  offersToTiers(trialPlans)
    .filter((tier) => tier.billingCycle === 'month')
    .map((tier) => ({ ...tier, features: PLAN_TRIAL_HIGHLIGHTS[tier.name] ?? tier.features.slice(0, 2) }))
    .sort((a, b) => rank(a.name) - rank(b.name))

/** Monthly trial offers for the claim modal: the seat count leads a trimmed feature list. */
export const claimTiers = (trialPlans: PlanGroup[]): PlanTier[] =>
  offersToTiers(trialPlans)
    .filter((tier) => tier.billingCycle === 'month')
    .map((tier) => ({
      ...tier,
      features: [tier.options[0].label, ...(PLAN_CLAIM_HIGHLIGHTS[tier.name] ?? tier.features)],
    }))
    .sort((a, b) => rank(a.name) - rank(b.name))
