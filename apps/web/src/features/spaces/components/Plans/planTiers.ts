import type { Subscription } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import type { PlanGroup, PlanOffer } from '../../hooks/billing/types'
import { getSubscriptionFeatures, getSubscriptionPlanName } from '../../hooks/billing/subscription'
import { ENTERPRISE_TIER, PLAN_FEATURES, PLAN_ORDER } from './fixtures'
import type {
  CurrentPlan,
  PlanChangeDirection,
  PlanCta,
  PlanPick,
  PlanSeatOption,
  PlanSummary,
  PlanTier,
} from './types'

const CYCLES = ['month', 'year'] as const

export const formatPlanPrice = (price: number, currency: string): string =>
  new Intl.NumberFormat('en', { style: 'currency', currency, maximumFractionDigits: 0 }).format(price)

export const priceSuffix = (billingCycle: 'month' | 'year' | null): string => (billingCycle === 'year' ? '/yr' : '/mo')

const monthlyEquivalent = (price: number, billingCycle: 'month' | 'year' | null): number =>
  billingCycle === 'year' ? price / 12 : price

/** The live subscription as the cards and the change dialog need it. */
export const toCurrentPlan = (subscription: Subscription, plan: PlanSummary, isTrialing: boolean): CurrentPlan => ({
  name: getSubscriptionPlanName(subscription) ?? plan.name,
  price: subscription.plan.currentPrice,
  currency: subscription.plan.currency,
  billingCycle: subscription.plan.billingCycle ?? null,
  isTrialing,
  periodEndsAt: plan.periodEndsAt,
  daysLeft: plan.daysLeft,
})

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
    if (pick.option.priceId === pick.tier.currentPriceId || !pick.option.paymentLinkId) {
      return current?.isTrialing
        ? { kind: 'billing', label: 'Add payment method' }
        : { kind: 'manage', label: 'Manage plan' }
    }
    // Another seat size of the same plan: a change, worded by seats rather than by plan name.
    const direction = getChangeDirection(current, pick)
    return {
      kind: 'change',
      direction,
      label: direction === 'upgrade' ? `Upgrade to ${pick.option.label}` : `Switch to ${pick.option.label}`,
    }
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
  features: offer.features,
})

/** Stripe's own list when the offer carries one, else the static copy for that plan. */
const featuresOf = (name: string, offers: Pick<PlanOffer, 'features'>[]): string[] =>
  offers.find((offer) => offer.features && offer.features.length > 0)?.features ?? PLAN_FEATURES[name] ?? []

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
          features: featuresOf(plan.name, offers),
          trialPeriodDays: offers[0].trialPeriodDays,
        },
      ]
    })
  })

/** The CGW never offers the current plan, so its card is rebuilt from the subscription and the seats entitlement. */
export const subscriptionToTier = (subscription: Subscription, seatsQuota: number | null | undefined): PlanTier => {
  const name = getSubscriptionPlanName(subscription) ?? 'Safe Pro'
  const features = getSubscriptionFeatures(subscription)

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
        seats: typeof seatsQuota === 'number' ? seatsQuota : null,
        price: subscription.plan.currentPrice,
        originalPrice: subscription.plan.originalPrice,
        features,
      },
    ],
    features: features.length > 0 ? features : (PLAN_FEATURES[name] ?? []),
    isCurrent: true,
    currentPriceId: subscription.plan.id,
  }
}

const bySeats = (a: PlanSeatOption, b: PlanSeatOption): number =>
  (a.seats ?? Number.POSITIVE_INFINITY) - (b.seats ?? Number.POSITIVE_INFINITY)

const getSubscriptionFeaturesOrFallback = (current: PlanTier, offered: PlanTier | undefined): string[] =>
  current.options[0]?.features?.length ? current.features : (offered?.features ?? current.features)

/**
 * One card per plan and cycle: the current plan's card absorbs the other seat sizes the CGW offers for its billing
 * cycle (so the user can resize from it); the same plan on the other cycle stays a regular offer.
 */
const mergeCurrentTier = (offered: PlanTier[], current: PlanTier): PlanTier[] => {
  const isSameCycle = (tier: PlanTier) => tier.name === current.name && tier.billingCycle === current.billingCycle
  const sameCycle = offered.find(isSameCycle)
  const extra = (sameCycle?.options ?? []).filter((option) => option.priceId !== current.currentPriceId)
  // A subscription without its own selling points borrows the offered tier's, so the card never falls back to copy.
  const features = getSubscriptionFeaturesOrFallback(current, sameCycle)
  const merged = { ...current, features, options: [...current.options, ...extra].sort(bySeats) }
  return [...offered.filter((tier) => !isSameCycle(tier)), merged]
}

const rank = (name: string): number => {
  const index = PLAN_ORDER.indexOf(name)
  return index === -1 ? PLAN_ORDER.length : index
}

/** The offered plans, the current one (when live) and the static Enterprise card, in catalog order. */
export const buildPlanTiers = (
  paidPlans: PlanGroup[],
  current?: { subscription: Subscription; seatsQuota: number | null | undefined },
): PlanTier[] => {
  const offered = offersToTiers(paidPlans)
  const tiers = current
    ? mergeCurrentTier(offered, subscriptionToTier(current.subscription, current.seatsQuota))
    : offered
  return [...tiers, ENTERPRISE_TIER].sort((a, b) => rank(a.name) - rank(b.name))
}

/** Monthly trial offers for the claim modal: the seat count leads the plan's own selling points, verbatim. */
export const claimTiers = (trialPlans: PlanGroup[]): PlanTier[] =>
  offersToTiers(trialPlans)
    .filter((tier) => tier.billingCycle === 'month')
    .map((tier) => ({ ...tier, features: [tier.options[0].label, ...tier.features] }))
    .sort((a, b) => rank(a.name) - rank(b.name))
