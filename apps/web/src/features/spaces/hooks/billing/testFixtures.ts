import { faker } from '@faker-js/faker'
import type { PaymentLink, Subscription } from '@safe-global/store/gateway/AUTO_GENERATED/billing'

export const paymentLinkFixture = (overrides: Partial<PaymentLink> = {}): PaymentLink => ({
  id: faker.string.uuid(),
  url: 'https://buy.stripe.com/test_123',
  active: true,
  metadata: { planName: 'Pro', FEATURE_NUMBER_OF_SAFES: '25' },
  customText: {},
  afterCompletion: {},
  lineItems: [{ price: { unitAmount: 4900, currency: 'usd', recurring: { interval: 'month' } }, quantity: 1 }],
  ...overrides,
})

export const subscriptionFixture = (overrides: Partial<Subscription> = {}): Subscription =>
  ({
    id: faker.string.uuid(),
    customerId: faker.string.uuid(),
    upstreamCustomerId: faker.string.uuid(),
    plan: {
      id: faker.string.uuid(),
      name: 'Pro',
      description: null,
      currentPrice: 49,
      originalPrice: null,
      paymentMethod: 'fiat',
      currency: 'usd',
      features: [],
      billingCycle: 'month',
      type: 'standard',
      product: 'prod_1',
    },
    status: 'active',
    createdAt: 1_700_000_000,
    startAt: 1_700_000_000,
    cancelledAt: null,
    cancelAt: null,
    validUntil: 1_800_000_000,
    metadata: { FEATURE_NUMBER_OF_SAFES: '25' },
    ...overrides,
  }) as Subscription
