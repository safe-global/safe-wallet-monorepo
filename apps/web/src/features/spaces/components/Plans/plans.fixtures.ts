import { http, HttpResponse } from 'msw'
import type { PaymentLink, Subscription } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import type { EntitlementsResponse } from '@safe-global/store/gateway/AUTO_GENERATED/entitlements'
import { groupOffersByPlan } from '../../hooks/billing/paymentLinks'

export const SPACE_ID = 'uuid-1'
export const DAY = 24 * 60 * 60
export const now = () => Math.floor(Date.now() / 1000)

// Staging Stripe catalog (customer group wallet_web), as the payment-links endpoint returns it.
const PLAN_METADATA = {
  Starter: {
    FEATURE_SPONSORED_TRANSACTIONS: '10',
    planDescriptions:
      '["10 sponsored transactions per month", "Unlimited Workspace members", "Advanced threat analysis", "Transaction simulation", "Shared address book", "MFA Authentication"]',
  },
  Business: {
    FEATURE_SPONSORED_TRANSACTIONS: '50',
    planDescriptions:
      '["50 sponsored transactions per month", "Unlimited Workspace members", "Advanced threat analysis", "Transaction simulation", "Policy engine", "Shared address book", "MFA Authentication"]',
  },
}

const link = (
  planName: keyof typeof PLAN_METADATA,
  seats: number,
  cents: number,
  interval: 'month' | 'year',
  trialPeriodDays?: number,
) =>
  ({
    id: `pl_${planName}_${seats}_${interval}${trialPeriodDays ? '_trial' : ''}`,
    url: 'https://buy.stripe.com/x',
    active: true,
    metadata: { planName, FEATURE_SAFE_SEATS: String(seats), ...PLAN_METADATA[planName] },
    lineItems: [
      {
        price: {
          id: `price_${planName}_${seats}_${interval}`,
          unitAmount: cents,
          currency: 'eur',
          recurring: { interval },
        },
      },
    ],
    trialPeriodDays: trialPeriodDays ?? null,
  }) satisfies PaymentLink

export const PAID_LINKS = [
  link('Starter', 2, 18_900, 'month'),
  link('Starter', 2, 199_000, 'year'),
  link('Business', 5, 66_900, 'month'),
  link('Business', 5, 719_000, 'year'),
  link('Business', 10, 99_900, 'month'),
  link('Business', 10, 1_079_000, 'year'),
  link('Business', 20, 166_900, 'month'),
  link('Business', 20, 1_799_000, 'year'),
]
export const TRIAL_LINKS = [link('Starter', 2, 18_900, 'month', 30), link('Business', 20, 166_900, 'month', 30)]

export const PAID_PLANS = groupOffersByPlan(PAID_LINKS)

/** Business 20 on free access with five days left; override any field for the other states. */
export const subscription = (overrides: Partial<Subscription> = {}): Subscription => ({
  id: 'sub_1',
  customerId: 'cus_1',
  upstreamCustomerId: SPACE_ID,
  status: 'trialing',
  createdAt: now() - 25 * DAY,
  startAt: now() - 25 * DAY,
  currentPeriodStart: now() - 25 * DAY,
  currentPeriodEnd: now() + 5 * DAY,
  cancelledAt: null,
  cancelAt: null,
  hasPaymentMethod: false,
  metadata: { planName: 'Business', FEATURE_SAFE_SEATS: '20', ...PLAN_METADATA.Business },
  plan: {
    id: 'price_Business_20_month',
    name: 'Business',
    currentPrice: 1669,
    originalPrice: null,
    paymentMethod: 'fiat',
    currency: 'eur',
    billingCycle: 'month',
    features: [],
    type: 'standard',
    product: null,
  },
  ...overrides,
})

const entitlements = (sub: Subscription | undefined): EntitlementsResponse => ({
  plan: sub
    ? {
        id: sub.plan.id,
        name: sub.plan.name ?? null,
        cycleEndsAt: new Date((sub.currentPeriodEnd ?? now()) * 1000).toISOString(),
      }
    : null,
  entitlements: sub
    ? [
        { feature: 'safe_seats', enabled: true, type: 'metered', quota: 20, used: 16, resetsAt: null },
        { feature: 'sponsored_transactions', enabled: true, type: 'metered', quota: 50, used: 46, resetsAt: null },
      ]
    : [],
})

/** Billing and entitlements endpoints answering for one Workspace. */
export const billingHandlers = (subscriptions: Subscription[], links: PaymentLink[] = PAID_LINKS) => [
  http.get(/\/v1\/billing\/spaces\/[^/]+\/subscriptions/, () => HttpResponse.json(subscriptions)),
  http.get(/\/v1\/billing\/spaces\/[^/]+\/payment-links$/, () => HttpResponse.json(links)),
  http.get(/\/v1\/spaces\/[^/]+\/entitlements$/, () => HttpResponse.json(entitlements(subscriptions[0]))),
]
