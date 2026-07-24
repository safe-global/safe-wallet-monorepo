import type { BillingState, PlanGroup, Subscription, SubscriptionUsage, UsageStatus, UsageSummary } from './types'

export const MOCK_PLAN_GROUPS: PlanGroup[] = [
  {
    id: 'starter',
    tiers: [
      {
        id: 'starter',
        name: 'Starter',
        priceMonthlyUsd: 0,
        cta: 'Default plan',
        isCurrent: true,
        features: ['Covers one Safe', '$5K/mo fee-free volume', 'Included by default', 'In-app support chat'],
      },
    ],
  },
  {
    id: 'pro',
    tiers: [
      {
        id: 'pro',
        name: 'Pro',
        priceMonthlyUsd: 49,
        cta: 'Upgrade to Pro',
        features: [
          'Covers unlimited Safes',
          '$500K/mo fee-free volume',
          '15 gasless transactions',
          'In-app support chat',
        ],
      },
      {
        id: 'pro-plus',
        name: 'Pro+',
        priceMonthlyUsd: 99,
        cta: 'Upgrade to Pro+',
        features: [
          'Covers unlimited Safes',
          '$1M/mo fee-free volume',
          '50 gasless transactions',
          'In-app support chat',
        ],
      },
    ],
  },
  {
    id: 'business',
    tiers: [
      {
        id: 'business',
        name: 'Business',
        priceMonthlyUsd: 599,
        cta: 'Upgrade to Business',
        features: ['Covers unlimited Safes', '$50M/mo fee-free volume', '100 gasless transactions', 'Priority support'],
      },
      {
        id: 'business-plus',
        name: 'Business+',
        priceMonthlyUsd: 1299,
        cta: 'Upgrade to Business+',
        features: ['Covers unlimited Safes', 'Unlimited volume', 'Unlimited gasless transactions', 'Priority support'],
      },
    ],
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

const MOCK_ACTIVE_SAFES = [
  '0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326',
  '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
  '0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8',
]

const HEALTHY_USAGE: SubscriptionUsage = {
  feeFreeVolume: { usedUsd: 250_000, allowanceUsd: 500_000 },
  gaslessTransactions: { used: 11, allowance: 15 },
  activeSafes: MOCK_ACTIVE_SAFES,
}

const SUBSCRIPTION_USAGE_BY_STATUS: Record<UsageStatus, SubscriptionUsage> = {
  within_limit: HEALTHY_USAGE,
  approaching_limit: {
    feeFreeVolume: { usedUsd: 450_000, allowanceUsd: 500_000 },
    gaslessTransactions: { used: 13, allowance: 15 },
    activeSafes: MOCK_ACTIVE_SAFES,
  },
  limit_reached: {
    feeFreeVolume: { usedUsd: 520_000, allowanceUsd: 500_000 },
    gaslessTransactions: { used: 15, allowance: 15 },
    activeSafes: MOCK_ACTIVE_SAFES,
  },
  payment_failed: HEALTHY_USAGE,
}

export const createStarterBillingState = (overrides?: Partial<BillingState>): BillingState => ({
  subscription: null,
  planGroups: MOCK_PLAN_GROUPS,
  usage: MOCK_USAGE,
  subscriptionUsage: null,
  ...overrides,
})

export const createPaidBillingState = (status: UsageStatus = 'within_limit'): BillingState => ({
  subscription: { ...MOCK_SUBSCRIPTION, status: status === 'payment_failed' ? 'past_due' : 'active' },
  planGroups: MOCK_PLAN_GROUPS,
  usage: MOCK_USAGE,
  subscriptionUsage: SUBSCRIPTION_USAGE_BY_STATUS[status],
})
