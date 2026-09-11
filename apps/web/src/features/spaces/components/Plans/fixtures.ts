import type { Meter, PlanTier } from './types'

// TODO(safe-pro): plan copy lives here until the catalog exposes features (Plan.features / product.marketingFeatures).
export const PLAN_ORDER = ['Starter', 'Business', 'Enterprise']

const SHARED_FEATURES = [
  'Unlimited Workspace members',
  'Advanced threat analysis',
  'Transaction simulation',
  'Shared address book',
  'MFA Authentication',
]

export const PLAN_FEATURES: Record<string, string[]> = {
  Starter: ['10 sponsored transactions / month', ...SHARED_FEATURES, 'Builder API access'],
  Business: [
    '50 sponsored transactions / month',
    ...SHARED_FEATURES,
    'Growth API access',
    'Pay fees from Safe accounts',
    'Policy engine',
  ],
  Enterprise: [
    'Unlimited sponsored transactions',
    ...SHARED_FEATURES,
    'Scale API access',
    'Pay fees from Safe accounts',
    'Policy engine',
  ],
}

export const PLAN_TRIAL_HIGHLIGHTS: Record<string, string[]> = {
  Starter: ['10 sponsored transactions / month', 'Advanced threat analysis'],
  Business: ['50 sponsored transactions / month', 'Advanced threat analysis'],
}

// TODO(safe-pro): Enterprise has no payment link; static card until sales flow is defined.
export const ENTERPRISE_TIER: PlanTier = {
  id: 'enterprise',
  name: 'Enterprise',
  currency: 'eur',
  billingCycle: null,
  options: [{ paymentLinkId: null, label: '20+ Safe accounts', price: null, originalPrice: null }],
  features: PLAN_FEATURES.Enterprise,
}

// TODO(safe-pro): no sponsored-transactions entitlement yet; placeholder until the CGW exposes it.
export const SPONSORED_TXS_PLACEHOLDER: Meter = { used: 11, quota: 15 }
