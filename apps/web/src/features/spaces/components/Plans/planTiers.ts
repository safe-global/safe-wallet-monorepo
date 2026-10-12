import type { Subscription } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import { BillingPeriod, MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import type { PlanGroup, PlanOffer } from '../../hooks/billing/types'
import {
  getSubscriptionFeatures,
  getSubscriptionPlanName,
  getSubscriptionSeats,
} from '../../hooks/billing/subscription'
import {
  ENTERPRISE_TIER,
  PLAN_CARD_COPY,
  PLAN_ORDER,
} from '@safe-global/views/features/spaces/components/Plans/planCatalog'
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

/** The analytics properties naming a picked plan, shared by every event that records a plan choice. */
export const pickProps = (pick: PlanPick) => ({
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

export const getPlanCta = (pick: PlanPick, current: CurrentPlan | undefined): PlanCta => {
  if (pick.tier.isCurrent) {
    if (pick.option.priceId === pick.tier.currentPriceId || !pick.option.paymentLinkId) {
      if (!current?.isTrialing) return { kind: 'manage', label: 'Manage plan' }
      return current.hasPaymentMethod
        ? { kind: 'manage', label: 'Manage plan' }
        : { kind: 'billing', label: 'Add payment method' }
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

  // The same plan on the other billing cycle is a resize too, so it is worded by seats like the current card.
  const target = pick.tier.name === current.name ? pick.option.label : pick.tier.name
  const direction = getChangeDirection(current, pick)
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
    features: features.length > 0 || name !== ENTERPRISE_TIER.name ? features : ENTERPRISE_TIER.features,
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

/** Tiers for the selected billing cycle. Keeps the current plan if the other cycle has no matching offer. */
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

/** "Manage plan" lives in the status panel; Enterprise changes go through sales. */
export type CardCta =
  | Exclude<PlanCta, { kind: 'manage' }>
  | { kind: 'current'; label: typeof PLAN_CARD_COPY.currentPlan }
  | { kind: 'account-team'; label: typeof PLAN_CARD_COPY.accountTeam }

export const getCardCta = (pick: PlanPick, current: CurrentPlan | undefined): CardCta => {
  if (pick.tier.isCurrent && pick.tier.name === ENTERPRISE_TIER.name) {
    return { kind: 'account-team', label: PLAN_CARD_COPY.accountTeam }
  }
  const cta = getPlanCta(pick, current)
  if (cta.kind === 'manage') return { kind: 'current', label: PLAN_CARD_COPY.currentPlan }
  if (cta.kind === 'change' && isCycleSwitch(pick, current)) {
    return {
      ...cta,
      label: pick.tier.billingCycle === 'year' ? PLAN_CARD_COPY.switchToYearly : PLAN_CARD_COPY.switchToMonthly,
    }
  }
  return cta
}

/** Same plan and Safe count, other billing cycle: the only thing that changes is how often it's billed. */
const isCycleSwitch = (pick: PlanPick, current: CurrentPlan | undefined): boolean =>
  current !== undefined &&
  pick.tier.name === current.name &&
  pick.tier.billingCycle !== null &&
  pick.tier.billingCycle !== current.billingCycle &&
  pick.option.label === current.seatsLabel

/** Show "Manage plan" in the status panel, including trials with a card on file. */
export const canManagePlan = (canManage: boolean | undefined, currentPlan: CurrentPlan | undefined): boolean =>
  Boolean(canManage || (currentPlan?.isTrialing && currentPlan.hasPaymentMethod))

/** Hide the static Enterprise card when Enterprise is the current plan. */
export const getCatalogTiers = (tiers: PlanTier[]): PlanTier[] => {
  const hasCurrentEnterprise = tiers.some((tier) => tier.isCurrent && tier.name === ENTERPRISE_TIER.name)
  return hasCurrentEnterprise ? tiers.filter((tier) => tier !== ENTERPRISE_TIER) : tiers
}

export type PlanPrice = { headline: string; suffix: string }

/** Same totals as the launch page: €669/mo, or the full yearly amount per year. */
export const getPlanPrice = (tier: PlanTier, option: PlanSeatOption): PlanPrice => {
  if (option.price === null) {
    return {
      headline: PLAN_CARD_COPY.custom,
      suffix: PLAN_CARD_COPY.customSuffix,
    }
  }
  return {
    headline: formatPlanPrice(option.price, tier.currency),
    suffix: priceSuffix(tier.billingCycle),
  }
}

export type YearlySaving = { amount: string; percent: string }

const percentFormat = new Intl.NumberFormat('en', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

/** How much less a yearly price costs than twelve monthly ones; undefined unless both prices exist and it saves. */
export const getYearlySaving = (
  twelveMonthsPrice: number | null | undefined,
  yearlyPrice: number | null | undefined,
  currency: string,
): YearlySaving | undefined => {
  if (twelveMonthsPrice == null || yearlyPrice == null) return undefined
  const saved = twelveMonthsPrice - yearlyPrice
  if (saved <= 0) return undefined
  return { amount: formatPlanPrice(saved, currency), percent: percentFormat.format(saved / twelveMonthsPrice) }
}

/** A card's yearly saving at the same Safe count; the counterpart card fills in the current plan's price, which the CGW leaves out. */
export const getCardSaving = (
  tier: PlanTier,
  option: PlanSeatOption | undefined,
  counterpartTier: PlanTier | undefined,
): YearlySaving | undefined => {
  if (option?.price == null) return undefined
  const counterpart = counterpartTier?.options.find((candidate) => candidate.label === option.label)
  if (tier.billingCycle === 'year') {
    const twelveMonths = option.originalPrice ?? (counterpart?.price == null ? null : counterpart.price * 12)
    return getYearlySaving(twelveMonths, option.price, tier.currency)
  }
  return getYearlySaving(option.price * 12, counterpart?.price, tier.currency)
}
