import type { PlanTier } from './types'

// TODO(safe-pro): plan copy lives here until the catalog exposes features (Plan.features / product.marketingFeatures).
export const PLAN_ORDER = ['Starter', 'Business', 'Enterprise']

/** The plan the trial and lapsed-Workspace modals lead with. */
export const RECOMMENDED_PLAN = 'Business'

const SECURITY_FEATURES = ['Unlimited Workspace members', 'Advanced threat analysis', 'Transaction simulation']
const COLLABORATION_FEATURES = ['Shared address book', 'MFA authentication']

export const PLAN_FEATURES: Record<string, string[]> = {
  Starter: ['10 sponsored transactions / month', ...SECURITY_FEATURES, ...COLLABORATION_FEATURES, 'Builder API access'],
  Business: [
    '50 sponsored transactions / month',
    ...SECURITY_FEATURES,
    'Policy engine',
    ...COLLABORATION_FEATURES,
    'Growth API access',
  ],
  Enterprise: [
    'Unlimited sponsored transactions',
    ...SECURITY_FEATURES,
    'Policy engine',
    ...COLLABORATION_FEATURES,
    'Scale API access',
  ],
}

// TODO(safe-pro): Enterprise has no payment link; static card until sales flow is defined.
export const ENTERPRISE_TIER: PlanTier = {
  id: 'enterprise',
  name: 'Enterprise',
  currency: 'eur',
  billingCycle: null,
  options: [{ paymentLinkId: null, priceId: null, label: '20+ Safe accounts', price: null, originalPrice: null }],
  features: PLAN_FEATURES.Enterprise,
}
