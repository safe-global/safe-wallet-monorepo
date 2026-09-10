import type { PaymentLink } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import type { BillingCycle, PlanGroup, PlanOffer } from './types'

// Stripe metadata vocabulary shared with the CGW (entitlements.constants.ts).
export const PLAN_NAME_METADATA_KEY = 'planName'
export const SAFE_SEATS_METADATA_KEY = 'FEATURE_SAFE_SEATS'
const UNLIMITED = 'unlimited'

type Metadata = Record<string, string | null | undefined>

type LineItem = {
  price?: { unitAmount?: number | null; currency?: string; recurring?: { interval?: string } | null }
  quantity?: number
}

const readMetadata = (link: PaymentLink): Metadata =>
  link.metadata && typeof link.metadata === 'object' ? (link.metadata as Metadata) : {}

const readLineItems = (link: PaymentLink): LineItem[] =>
  Array.isArray(link.lineItems) ? (link.lineItems as LineItem[]) : []

export const getPlanName = (link: PaymentLink): string | null => readMetadata(link)[PLAN_NAME_METADATA_KEY] ?? null

export const getSeats = (link: PaymentLink): PlanOffer['seats'] => {
  const raw = readMetadata(link)[SAFE_SEATS_METADATA_KEY]?.trim()
  if (!raw) return null
  if (raw.toLowerCase() === UNLIMITED) return UNLIMITED
  const parsed = Number.parseInt(raw, 10)
  return Number.isNaN(parsed) || parsed < 0 ? null : parsed
}

const toCycle = (interval: string | undefined): BillingCycle | null =>
  interval === 'month' || interval === 'year' ? interval : null

export const getPrice = (link: PaymentLink): Pick<PlanOffer, 'price' | 'currency' | 'billingCycle'> => {
  const items = readLineItems(link)
  const cents = items.reduce((sum, item) => sum + (item.price?.unitAmount ?? 0) * (item.quantity ?? 1), 0)

  return {
    price: cents > 0 ? cents / 100 : null,
    currency: (items[0]?.price?.currency ?? 'eur').toLowerCase(),
    billingCycle: toCycle(items[0]?.price?.recurring?.interval),
  }
}

export const toPlanOffer = (link: PaymentLink): PlanOffer | null => {
  const planName = getPlanName(link)
  if (!link.active || !planName) return null

  return {
    paymentLinkId: link.id,
    planName,
    seats: getSeats(link),
    trialPeriodDays: link.trialPeriodDays ?? null,
    ...getPrice(link),
  }
}

const seatsRank = (seats: PlanOffer['seats']): number =>
  seats === null ? Number.POSITIVE_INFINITY : seats === UNLIMITED ? Number.MAX_SAFE_INTEGER : seats

const cycleRank = (cycle: BillingCycle | null): number => (cycle === 'month' ? 0 : cycle === 'year' ? 1 : 2)

const byCycleThenSeats = (a: PlanOffer, b: PlanOffer): number =>
  cycleRank(a.billingCycle) - cycleRank(b.billingCycle) || seatsRank(a.seats) - seatsRank(b.seats)

/** Offers grouped by plan name in catalog order; inactive or untagged links are dropped. */
export const groupOffersByPlan = (links: PaymentLink[]): PlanGroup[] => {
  const groups = new Map<string, PlanOffer[]>()

  for (const link of links) {
    const offer = toPlanOffer(link)
    if (!offer) continue
    const offers = groups.get(offer.planName) ?? []
    offers.push(offer)
    groups.set(offer.planName, offers)
  }

  return [...groups].map(([name, offers]) => ({ name, offers: [...offers].sort(byCycleThenSeats) }))
}

/** The free period the CGW offers this Workspace, or null when only paid links are on offer. */
export const getTrialPeriodDays = (plans: PlanGroup[]): number | null =>
  plans.flatMap((plan) => plan.offers).find((offer) => offer.trialPeriodDays !== null)?.trialPeriodDays ?? null

/**
 * The CGW offers a Workspace either trial links (never subscribed) or paid links (subscribed, minus its current
 * plan), so in practice one side is empty; splitting keeps the trial flows and the Plans page reading the right one.
 */
export const splitPlansByTrial = (plans: PlanGroup[]): { trialPlans: PlanGroup[]; paidPlans: PlanGroup[] } => {
  const pick = (isTrial: boolean): PlanGroup[] =>
    plans
      .map((plan) => ({
        name: plan.name,
        offers: plan.offers.filter((offer) => (offer.trialPeriodDays !== null) === isTrial),
      }))
      .filter((plan) => plan.offers.length > 0)

  return { trialPlans: pick(true), paidPlans: pick(false) }
}
