import { http, HttpResponse } from 'msw'
import type { MemberDto, SpaceAddressBookDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { Subscription } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import type { EntitlementsResponse } from '@safe-global/store/gateway/AUTO_GENERATED/entitlements'

const SPACE_ID = '11111111-1111-4111-8111-111111111111'
const DAY = 24 * 60 * 60
const now = () => Math.floor(Date.now() / 1000)

/** An active Workspace plan for the Safenet access stories. */
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
  metadata: { planName: 'Business', FEATURE_SAFE_SEATS: '20' },
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
        status: sub.status === 'trialing' ? 'trialing' : 'active',
      }
    : null,
  entitlements: sub
    ? [
        { feature: 'safe_seats', enabled: true, type: 'metered', quota: 20, used: 16, resetsAt: null },
        { feature: 'sponsored_transactions', enabled: true, type: 'metered', quota: 50, used: 46, resetsAt: null },
      ]
    : [],
})

const membership = (): MemberDto => {
  const joinedAt = new Date((now() - 25 * DAY) * 1000).toISOString()
  return {
    id: 1,
    role: 'ADMIN',
    status: 'ACTIVE',
    name: 'Admin User',
    invitedBy: null,
    createdAt: joinedAt,
    updatedAt: joinedAt,
    user: { id: 1, status: 'ACTIVE', email: null, address: null },
  }
}

const addressBook: SpaceAddressBookDto = { spaceUuid: SPACE_ID, data: [] }

/** Keep access checks local and deterministic, without contacting billing or Workspace services. */
export const billingHandlers = (subscriptions: Subscription[]) => [
  http.get(/\/v1\/billing\/spaces\/[^/]+\/subscriptions/, () => HttpResponse.json(subscriptions)),
  http.get(/\/v1\/spaces\/[^/]+\/entitlements$/, () => HttpResponse.json(entitlements(subscriptions[0]))),
  http.get(/\/v1\/spaces\/[^/]+\/membership$/, () => HttpResponse.json(membership())),
  http.get(/\/v1\/spaces\/[^/]+\/address-book$/, () => HttpResponse.json(addressBook)),
]
