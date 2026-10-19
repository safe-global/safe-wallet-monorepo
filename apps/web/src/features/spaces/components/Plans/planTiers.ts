import type { Subscription } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import { trackEvent } from '@/services/analytics'
import { SAFE_PRO_EVENTS, type SAFE_PRO_PLANS_LABELS } from '@/services/analytics/events/safe-pro'
import { BillingPeriod, MixpanelEventParams, type PlanLocation } from '@/services/analytics/mixpanel-events'
import type { PlanGroup, PlanOffer } from '../../hooks/billing/types'
import { getPlanCardCopy } from '../../hooks/billing/paymentLinks'
import {
  getSubscriptionFeatures,
  getSubscriptionPlanName,
  getSubscriptionSeats,
} from '../../hooks/billing/subscription'
import { ENTERPRISE_TIER, PLAN_ORDER } from '@safe-global/views/features/spaces/components/Plans/planCatalog'
import type {
  CurrentPlan,
  PlanChangeDirection,
  PlanCta,
  PlanPick,
  PlanSeatOption,
  PlanSummary,
  PlanTier,
} from '@safe-global/views/features/spaces/components/Plans/types'

const CYCLES = ['month', 'year'] as const

export const formatPlanPrice = (price: number, currency: string): string =>
  new Intl.NumberFormat('en', { style: 'currency', currency, maximumFractionDigits: 0 }).format(price)

export const priceSuffix = (billingCycle: 'month' | 'year' | null): string => (billingCycle === 'year' ? '/yr' : '/mo')

const monthlyEquivalent = (price: number, billingCycle: 'month' | 'year' | null): number =>
  billingCycle === 'year' ? price / 12 : price

export const plansClickParams = (label: SAFE_PRO_PLANS_LABELS, location: PlanLocation) => ({
  [MixpanelEventParams.CTA]: label,
  [MixpanelEventParams.LOCATION]: location,
})

export const trackPlansClick = (label: SAFE_PRO_PLANS_LABELS, location: PlanLocation) =>
  trackEvent({ ...SAFE_PRO_EVENTS.PLANS_CLICKED, label }, plansClickParams(label, location))

/** The analytics properties naming a picked plan, shared by every event that records a plan choice. */
export const pickProps = (pick: {
  tier: Pick<PlanTier, 'name' | 'billingCycle'>
  option: Pick<PlanPick['option'], 'seats'>
}) => ({
  [MixpanelEventParams.TARGET_PLAN]: pick.tier.name.toLowerCase(),
  [MixpanelEventParams.SEATS]: pick.option.seats ?? undefined,
  [MixpanelEventParams.BILLING_PERIOD]:
    pick.tier.billingCycle === 'year'
      ? BillingPeriod.YEARLY
      : pick.tier.billingCycle === 'month'
        ? BillingPeriod.MONTHLY
        : undefined,
})

/** The subscription's own seats tag wins: the entitlements quota lags until the billing webhook lands. */
const currentSeats = (
  subscription: Subscription,
  seatsQuota: number | null | undefined,
): PlanOffer['seats'] | undefined =>
  getSubscriptionSeats(subscription) ??
  (seatsQuota === undefined ? undefined : seatsQuota === null ? 'unlimited' : seatsQuota)

/** The live subscription as the cards and the change dialog need it. */
export const toCurrentPlan = (
  subscription: Subscription,
  plan: PlanSummary,
  isTrialing: boolean,
  seatsQuota?: number | null,
): CurrentPlan => {
  const seats = currentSeats(subscription, seatsQuota)
  return {
    name: getSubscriptionPlanName(subscription) ?? plan.name,
    price: subscription.plan.currentPrice,
    currency: subscription.plan.currency,
    billingCycle: subscription.plan.billingCycle ?? null,
    isTrialing,
    hasPaymentMethod: subscription.hasPaymentMethod === true,
    periodEndsAt: plan.periodEndsAt,
    daysLeft: plan.daysLeft,
    seats: typeof seats === 'number' ? seats : undefined,
    seatsLabel: seats === undefined ? undefined : seatsLabel(seats),
  }
}

/** Compares monthly-equivalent prices, so a yearly plan is not read as a 12x upgrade. */
export const getChangeDirection = (current: CurrentPlan | undefined, pick: PlanPick): PlanChangeDirection => {
  if (!current || pick.option.price === null) return 'change'
  const next = monthlyEquivalent(pick.option.price, pick.tier.billingCycle)
  const now = monthlyEquivalent(current.price, current.billingCycle)
  return next > now ? 'upgrade' : next < now ? 'downgrade' : 'change'
}

const isCycleSwitch = (pick: PlanPick, current: CurrentPlan): boolean =>
  pick.tier.name === current.name &&
  pick.tier.billingCycle !== null &&
  pick.tier.billingCycle !== current.billingCycle &&
  pick.option.label === current.seatsLabel

export const getPlanCta = (pick: PlanPick, current: CurrentPlan | undefined): PlanCta => {
  if (pick.tier.isCurrent) {
    if (pick.tier.name === ENTERPRISE_TIER.name) return { kind: 'account-team', label: 'Change via your account team' }
    if (pick.option.priceId === pick.tier.currentPriceId || !pick.option.paymentLinkId) {
      return current?.isTrialing && !current.hasPaymentMethod
        ? { kind: 'billing', label: 'Add payment method' }
        : { kind: 'current', label: 'Current plan' }
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
  if (!current) return { kind: 'subscribe', label: `Continue with ${pick.tier.name}` }

  const direction = getChangeDirection(current, pick)
  if (isCycleSwitch(pick, current)) {
    return {
      kind: 'change',
      direction,
      label: pick.tier.billingCycle === 'year' ? 'Switch to yearly' : 'Switch to monthly',
    }
  }
  // The same plan on the other billing cycle is a resize too, so it is worded by seats like the current card.
  const target = pick.tier.name === current.name ? pick.option.label : pick.tier.name
  return {
    kind: 'change',
    direction,
    label: direction === 'upgrade' ? `Upgrade to ${target}` : `Switch to ${target}`,
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

const featuresOf = (offers: Pick<PlanOffer, 'features'>[]): string[] =>
  offers.find((offer) => offer.features && offer.features.length > 0)?.features ?? []

/** One tier per plan and billing cycle; a yearly option carries twelve monthly payments as its reference price. */
export const _offersToTiers = (plans: PlanGroup[]): PlanTier[] =>
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
          features: featuresOf(offers),
          copy: offers[0].copy,
          trialPeriodDays: offers[0].trialPeriodDays,
        },
      ]
    })
  })

/** The CGW never offers the current plan, so its card is rebuilt from the subscription and the seats entitlement. */
export const _subscriptionToTier = (subscription: Subscription, seatsQuota: number | null | undefined): PlanTier => {
  const name = getSubscriptionPlanName(subscription) ?? 'Safe Pro'
  const features = getSubscriptionFeatures(subscription)
  const seats = currentSeats(subscription, seatsQuota) ?? null
  const isEnterpriseFallback = features.length === 0 && name === ENTERPRISE_TIER.name

  return {
    id: 'current',
    name,
    currency: subscription.plan.currency,
    billingCycle: subscription.plan.billingCycle ?? null,
    options: [
      {
        paymentLinkId: null,
        priceId: subscription.plan.id,
        label: seatsLabel(seats),
        seats: typeof seats === 'number' ? seats : null,
        price: subscription.plan.currentPrice,
        originalPrice: subscription.plan.originalPrice,
        features,
      },
    ],
    features: isEnterpriseFallback ? ENTERPRISE_TIER.features : features,
    copy: isEnterpriseFallback
      ? ENTERPRISE_TIER.copy
      : getPlanCardCopy((subscription.metadata ?? {}) as Record<string, string | null | undefined>),
    isCurrent: true,
    currentPriceId: subscription.plan.id,
  }
}

const bySeats = (a: PlanSeatOption, b: PlanSeatOption): number =>
  (a.seats ?? Number.POSITIVE_INFINITY) - (b.seats ?? Number.POSITIVE_INFINITY)

const getSubscriptionFeaturesOrFallback = (current: PlanTier, offered: PlanTier | undefined): string[] =>
  current.options[0]?.features?.length ? current.features : (offered?.features ?? current.features)

/** The current card absorbs the same-cycle seat sizes so the user can resize from it; the other cycle stays an offer. */
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
  const index = PLAN_ORDER.findIndex((plan) => plan === name)
  return index === -1 ? PLAN_ORDER.length : index
}

/** The offered plans, the current one (when live) and the static Enterprise card, in catalog order. */
export const buildPlanTiers = (
  paidPlans: PlanGroup[],
  current?: { subscription: Subscription; seatsQuota: number | null | undefined },
): PlanTier[] => {
  const offered = _offersToTiers(paidPlans)
  const tiers = current
    ? mergeCurrentTier(offered, _subscriptionToTier(current.subscription, current.seatsQuota))
    : offered
  return [...tiers, ENTERPRISE_TIER].sort((a, b) => rank(a.name) - rank(b.name))
}

export const pickSeatOption = (tier: PlanTier, currentPlan?: CurrentPlan, seatsLabel?: string) => {
  const isCurrentPlan = tier.isCurrent || currentPlan?.name === tier.name
  return (
    tier.options.find((candidate) => candidate.label === seatsLabel) ??
    tier.options.find((candidate) => candidate.priceId === tier.currentPriceId) ??
    tier.options.find((candidate) => isCurrentPlan && candidate.label === currentPlan?.seatsLabel) ??
    tier.options[0]
  )
}

export const getVisibleTiers = (tiers: PlanTier[], cycle: 'month' | 'year'): PlanTier[] =>
  tiers.filter((tier) => {
    if (tier.billingCycle === null || tier.billingCycle === cycle) return true
    return Boolean(tier.isCurrent) && !tiers.some((other) => other.name === tier.name && other.billingCycle === cycle)
  })

/** Monthly trial offers for the claim modal: the seat count leads the plan's own selling points, verbatim. */
export const claimTiers = (trialPlans: PlanGroup[]): PlanTier[] =>
  _offersToTiers(trialPlans)
    .filter((tier) => tier.billingCycle === 'month')
    .map((tier) => ({ ...tier, features: [tier.options[0].label, ...tier.features] }))
    .sort((a, b) => rank(a.name) - rank(b.name))

export const getCatalogTiers = (tiers: PlanTier[]): PlanTier[] => {
  const hasCurrentEnterprise = tiers.some((tier) => tier.isCurrent && tier.name === ENTERPRISE_TIER.name)
  return hasCurrentEnterprise ? tiers.filter((tier) => tier !== ENTERPRISE_TIER) : tiers
}

export const getPlanPrice = (tier: PlanTier, option: PlanSeatOption): { headline: string; suffix: string } => {
  if (option.price === null) {
    return {
      headline: 'Custom',
      suffix: 'Annual term',
    }
  }
  return {
    headline: formatPlanPrice(option.price, tier.currency),
    suffix: priceSuffix(tier.billingCycle),
  }
}

const percentFormat = new Intl.NumberFormat('en', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

export const getCardSaving = (
  tier: PlanTier,
  option: PlanSeatOption | undefined,
  counterpartTier: PlanTier | undefined,
): { amount: string; percent: string } | undefined => {
  if (option?.price == null) return undefined
  const counterpart = counterpartTier?.options.find((candidate) => candidate.label === option.label)?.price
  const isYearly = tier.billingCycle === 'year'
  const twelveMonths = isYearly
    ? (option.originalPrice ?? (counterpart == null ? null : counterpart * 12))
    : option.price * 12
  const yearly = isYearly ? option.price : counterpart
  if (twelveMonths == null || yearly == null || yearly >= twelveMonths) return undefined
  const saved = twelveMonths - yearly
  return { amount: formatPlanPrice(saved, tier.currency), percent: percentFormat.format(saved / twelveMonths) }
}
