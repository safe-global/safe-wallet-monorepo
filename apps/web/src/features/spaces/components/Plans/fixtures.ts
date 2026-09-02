import type { PlanTier, PlansData } from './types'

const SHARED_FEATURES = [
  'Unlimited Workspace members',
  'Advanced threat analysis',
  'Transaction simulation',
  'Shared address book',
  'MFA Authentication',
]

const tier = (overrides: Partial<PlanTier> & Pick<PlanTier, 'id' | 'name'>): PlanTier => ({
  price: null,
  originalPrice: null,
  currency: 'eur',
  billingCycle: null,
  seats: ['10 Safe accounts'],
  features: SHARED_FEATURES,
  ...overrides,
})

const STARTER_FEATURES = ['10 sponsored transactions / month', ...SHARED_FEATURES, 'Builder API access']
const BUSINESS_FEATURES = [
  '50 sponsored transactions / month',
  ...SHARED_FEATURES,
  'Growth API access',
  'Pay fees from Safe accounts',
  'Policy engine',
]
const ENTERPRISE_FEATURES = [
  'Unlimited sponsored transactions',
  ...SHARED_FEATURES,
  'Scale API access',
  'Pay fees from Safe accounts',
  'Policy engine',
]

export const TIERS: PlanTier[] = [
  tier({ id: 'starter-month', name: 'Starter', price: 149, billingCycle: 'month', features: STARTER_FEATURES }),
  tier({
    id: 'starter-year',
    name: 'Starter',
    price: 1608,
    originalPrice: 1788,
    billingCycle: 'year',
    features: STARTER_FEATURES,
  }),
  tier({
    id: 'business-month',
    name: 'Business',
    price: 499,
    billingCycle: 'month',
    seats: ['10 Safe accounts', '20 Safe accounts', '50 Safe accounts'],
    features: BUSINESS_FEATURES,
    isCurrent: true,
  }),
  tier({
    id: 'business-year',
    name: 'Business',
    price: 5389,
    originalPrice: 5988,
    billingCycle: 'year',
    seats: ['10 Safe accounts', '20 Safe accounts', '50 Safe accounts'],
    features: BUSINESS_FEATURES,
    isCurrent: true,
  }),
  tier({ id: 'enterprise', name: 'Enterprise', seats: ['20+ Safe accounts'], features: ENTERPRISE_FEATURES }),
]

// ponytail: static fixture until the entitlement hooks land (PLA-1828)
export const TRIAL_PLANS: PlansData = {
  plan: { name: 'Safe Pro', status: 'trialing', periodEndsAt: '2026-12-06T00:00:00Z' },
  safeAccounts: { used: 6, quota: 10 },
  sponsoredTxs: { used: 11, quota: 15 },
  tiers: TIERS,
}
