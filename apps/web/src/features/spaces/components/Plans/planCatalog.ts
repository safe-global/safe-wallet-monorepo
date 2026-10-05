import type { PlanTier } from './types'

// TODO(safe-pro): plan copy lives here until the catalog exposes features (Plan.features / product.marketingFeatures).
export const PLAN_ORDER = ['Starter', 'Business', 'Enterprise']

/** The plan the trial and lapsed-Workspace modals lead with. */
export const RECOMMENDED_PLAN = 'Business'

const SHARED_FEATURES = [
  'Unlimited Workspace members',
  'Advanced threat analysis',
  'Transaction simulation',
  'Shared address book',
  'MFA Authentication',
]

export const PLAN_FEATURES: Record<string, string[]> = {
  Starter: ['10 eligible sponsored transactions per month, up to €5 each', ...SHARED_FEATURES, 'Builder API access'],
  Business: [
    '50 eligible sponsored transactions per month, up to €5 each',
    ...SHARED_FEATURES,
    'Growth API access',
    'Pay fees from Safe accounts (coming soon)',
    'Policy engine',
  ],
  Enterprise: [
    'Unlimited eligible sponsored transactions, up to €10 each',
    ...SHARED_FEATURES,
    'Scale API access',
    'Pay fees from Safe accounts (coming soon)',
    'Policy engine',
  ],
}

// TODO(safe-pro): Enterprise has no payment link; static card until sales flow is defined.
export const ENTERPRISE_TIER: PlanTier = {
  id: 'enterprise',
  name: 'Enterprise',
  currency: 'eur',
  billingCycle: null,
  options: [
    { paymentLinkId: null, priceId: null, label: 'More than 20 Safe accounts', price: null, originalPrice: null },
  ],
  features: PLAN_FEATURES.Enterprise,
}
