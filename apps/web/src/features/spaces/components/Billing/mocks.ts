import type { BillingPlan, BillingState, Subscription, UsageSummary } from './types'

export const MOCK_PLANS: BillingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    priceUsd: 0,
    interval: 'month',
    features: ['Pay-as-you-go gas', 'Community support'],
  },
  {
    id: 'pro',
    name: 'Pro',
    priceUsd: 99,
    interval: 'month',
    features: ['Flat gas pricing', 'Priority support', 'Usage analytics'],
    highlighted: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceUsd: 499,
    interval: 'month',
    features: ['Custom limits', 'Dedicated support', 'SLA'],
  },
]

const MOCK_USAGE: UsageSummary = {
  movedUsd: 128_500,
  transactionCount: 42,
  periodDays: 30,
}

const MOCK_SUBSCRIPTION: Subscription = {
  planId: 'pro',
  planName: 'Pro',
  status: 'active',
  currentPeriodEnd: '2026-07-31T00:00:00.000Z',
}

export const createStarterBillingState = (overrides?: Partial<BillingState>): BillingState => ({
  subscription: null,
  currentPlanId: 'starter',
  plans: MOCK_PLANS,
  usage: MOCK_USAGE,
  ...overrides,
})

export const createPaidBillingState = (): BillingState => ({
  subscription: MOCK_SUBSCRIPTION,
  currentPlanId: 'pro',
  plans: MOCK_PLANS,
  usage: MOCK_USAGE,
})
