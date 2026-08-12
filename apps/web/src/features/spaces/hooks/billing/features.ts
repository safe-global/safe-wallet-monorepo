import type { PaymentLink, Subscription } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import { FREE_NUMBER_OF_SAFES } from '@/features/spaces/constants'

/**
 * Stripe metadata is an untyped `Record<string, string>` in the CGW schema.
 * Feature flags for a plan are stored as `FEATURE_*` keys on the payment link /
 * subscription metadata (mirrors the safe-dashboard convention).
 */
export const FEATURE_PREFIX = 'FEATURE_'

/** Metadata key holding the max number of Safe accounts a plan allows. */
export const FEATURE_NUMBER_OF_SAFES = 'FEATURE_NUMBER_OF_SAFES'

export { FREE_NUMBER_OF_SAFES }

type Metadata = Record<string, string>

const asMetadata = (metadata: unknown): Metadata =>
  metadata && typeof metadata === 'object' ? (metadata as Metadata) : {}

/** Reads a single feature value from a plan's metadata, or `undefined` when absent. */
export const getFeatureValue = (metadata: unknown, key: string): string | undefined => asMetadata(metadata)[key]

/**
 * Max number of Safe accounts allowed by a plan's metadata. Falls back to the
 * free tier when the feature is missing or unparseable, so callers always get a
 * usable number.
 */
export const getNumberOfSafes = (metadata: unknown): number => {
  const raw = getFeatureValue(metadata, FEATURE_NUMBER_OF_SAFES)
  const parsed = Number.parseInt(raw ?? '', 10)
  return Number.isNaN(parsed) ? FREE_NUMBER_OF_SAFES : parsed
}

const FEATURE_LABELS: Record<string, (value: string) => string> = {
  [FEATURE_NUMBER_OF_SAFES]: (value) => `Covers up to ${value} Safe Account${value === '1' ? '' : 's'}`,
}

const formatFeatureLabel = (key: string, value: string): string => {
  const formatter = FEATURE_LABELS[key]
  return formatter ? formatter(value) : value
}

/**
 * Human-readable feature bullets derived from a plan's `FEATURE_*` metadata,
 * for the plan cards. Falls back to the explicit `features` array when metadata
 * carries no `FEATURE_*` keys.
 */
export const getPlanFeatures = (metadata: unknown, fallback: string[] = []): string[] => {
  const meta = asMetadata(metadata)
  const featureKeys = Object.keys(meta).filter((key) => key.startsWith(FEATURE_PREFIX) && meta[key])
  if (featureKeys.length === 0) return fallback
  return featureKeys.map((key) => formatFeatureLabel(key, meta[key]))
}

/** The Safe-account allowance of the active subscription, or the free tier. */
export const getSubscriptionNumberOfSafes = (subscription: Subscription | undefined): number =>
  subscription ? getNumberOfSafes(subscription.metadata) : FREE_NUMBER_OF_SAFES

/** The Safe-account allowance advertised by a payment link (plan card). */
export const getPaymentLinkNumberOfSafes = (paymentLink: PaymentLink): number => getNumberOfSafes(paymentLink.metadata)

/** Metadata key carrying the plan display name (Stripe convention). */
const PLAN_NAME_KEY = 'planName'

/** Display name for a plan card, from metadata, with a safe fallback. */
export const getPlanName = (metadata: unknown): string => getFeatureValue(metadata, PLAN_NAME_KEY) ?? 'Plan'

const CURRENCY_SYMBOLS: Record<string, string> = {
  usd: '$',
  eur: '€',
  gbp: '£',
}

/**
 * The CGW types `lineItems` as untyped `object[]`, but Stripe payment-link line
 * items carry `{ price: { unitAmount, currency, recurring }, quantity }`. This
 * reads that shape defensively.
 */
type LineItemPrice = { unitAmount?: number; currency?: string; recurring?: { interval?: string } | null }
type LineItem = { price?: LineItemPrice; quantity?: number }

const readLineItems = (paymentLink: PaymentLink): LineItem[] =>
  Array.isArray(paymentLink.lineItems) ? (paymentLink.lineItems as LineItem[]) : []

export interface PlanPrice {
  /** Total amount in whole currency units (e.g. 49 for $49). */
  amount: number
  /** Currency symbol ("$"/"€"/"£") or the uppercased code as fallback. */
  symbol: string
  /** Billing cycle suffix, e.g. "/mo" or "/yr". */
  cycle: string
}

const cycleSuffix = (interval?: string): string => (interval === 'year' ? '/yr' : '/mo')

/**
 * Price for a plan card, summed from the payment link's Stripe line items
 * (`unitAmount` is in cents). Returns `undefined` when no priced line item
 * exists, so the card can show a placeholder.
 */
export const getPlanPrice = (paymentLink: PaymentLink): PlanPrice | undefined => {
  const lineItems = readLineItems(paymentLink)
  const totalCents = lineItems.reduce((sum, item) => {
    const unitAmount = typeof item.price?.unitAmount === 'number' ? item.price.unitAmount : 0
    const quantity = typeof item.quantity === 'number' ? item.quantity : 1
    return sum + unitAmount * quantity
  }, 0)

  if (totalCents <= 0) return undefined

  const currency = lineItems[0]?.price?.currency ?? 'usd'
  const interval = lineItems[0]?.price?.recurring?.interval

  return {
    amount: totalCents / 100,
    symbol: CURRENCY_SYMBOLS[currency.toLowerCase()] ?? currency.toUpperCase(),
    cycle: cycleSuffix(interval),
  }
}
