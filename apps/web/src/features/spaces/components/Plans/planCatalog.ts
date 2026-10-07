import type { PlanTier } from './types'

export const PLAN_ORDER = ['Starter', 'Business', 'Enterprise']

/** The plan the trial and lapsed-Workspace modals lead with. */
export const RECOMMENDED_PLAN = 'Business'

// TODO(safe-pro): Enterprise has no payment link; static card until sales flow is defined.
export const ENTERPRISE_TIER: PlanTier = {
  id: 'enterprise',
  name: 'Enterprise',
  currency: 'eur',
  billingCycle: null,
  options: [{ paymentLinkId: null, priceId: null, label: '20+ Safe accounts', price: null, originalPrice: null }],
  features: [
    'Unlimited sponsored transactions',
    'Shared address book',
    'Activity log',
    'Advanced threat analysis',
    'Transaction simulation',
    'MFA authentication',
    'Policy engine',
    'Transaction proposers',
    'Custom Safe capacity',
    'Multiple workspaces',
    'Tailored contract & billing terms',
    'Tailored support + customized onboarding',
  ],
}
