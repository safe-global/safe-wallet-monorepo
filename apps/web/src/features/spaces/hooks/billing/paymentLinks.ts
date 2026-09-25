import type { PaymentLink } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import type { BillingCycle, PlanGroup, PlanOffer } from './types'

// Stripe metadata vocabulary shared with the CGW (entitlements.constants.ts).
export const PLAN_NAME_METADATA_KEY = 'planName'
export const SAFE_SEATS_METADATA_KEY = 'FEATURE_SAFE_SEATS'
export const PLAN_DESCRIPTIONS_METADATA_KEY = 'planDescriptions'
const UNLIMITED = 'unlimited'

type Metadata = Record<string, string | null | undefined>

type LineItem = {
  price?: { id?: string; unitAmount?: number | null; currency?: string; recurring?: { interval?: string } | null }
  quantity?: number
}

const readMetadata = (link: PaymentLink): Metadata =>
  link.metadata && typeof link.metadata === 'object' ? (link.metadata as Metadata) : {}

const readLineItems = (link: PaymentLink): LineItem[] =>
  Array.isArray(link.lineItems) ? (link.lineItems as LineItem[]) : []

export const _getPlanName = (link: PaymentLink): string | null => readMetadata(link)[PLAN_NAME_METADATA_KEY] ?? null

/** The seat quota a link or subscription carries in its Stripe metadata; null when absent or malformed. */
export const getSeatsFromMetadata = (metadata: Metadata): PlanOffer['seats'] => {
  const raw = metadata[SAFE_SEATS_METADATA_KEY]?.trim()
  if (!raw) return null
  if (raw.toLowerCase() === UNLIMITED) return UNLIMITED
  const parsed = Number.parseInt(raw, 10)
  return Number.isNaN(parsed) || parsed < 0 ? null : parsed
}

export const _getSeats = (link: PaymentLink): PlanOffer['seats'] => getSeatsFromMetadata(readMetadata(link))

/** The JSON-encoded list of selling points on the link, or an empty list when missing or malformed. */
export const getPlanDescriptions = (metadata: Metadata): string[] => {
  const raw = metadata[PLAN_DESCRIPTIONS_METADATA_KEY]
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

const toCycle = (interval: string | undefined): BillingCycle | null =>
  interval === 'month' || interval === 'year' ? interval : null

export const _getPrice = (link: PaymentLink): Pick<PlanOffer, 'price' | 'currency' | 'billingCycle'> => {
  const items = readLineItems(link)
  const cents = items.reduce((sum, item) => sum + (item.price?.unitAmount ?? 0) * (item.quantity ?? 1), 0)

  return {
    price: cents > 0 ? cents / 100 : null,
    currency: (items[0]?.price?.currency ?? 'eur').toLowerCase(),
    billingCycle: toCycle(items[0]?.price?.recurring?.interval),
  }
}

export const _toPlanOffer = (link: PaymentLink): PlanOffer | null => {
  const planName = _getPlanName(link)
  if (!link.active || !planName) return null

  return {
    paymentLinkId: link.id,
    priceId: readLineItems(link)[0]?.price?.id ?? null,
    planName,
    seats: _getSeats(link),
    trialPeriodDays: link.trialPeriodDays ?? null,
    features: getPlanDescriptions(readMetadata(link)),
    ..._getPrice(link),
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
    const offer = _toPlanOffer(link)
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

/** The CGW offers either trial links (never subscribed) or paid links, so in practice one side is empty. */
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
