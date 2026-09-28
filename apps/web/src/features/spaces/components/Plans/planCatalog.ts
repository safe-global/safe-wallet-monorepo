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

export type PlanNameV2 = 'Starter' | 'Business' | 'Enterprise'

export type PlanContentV2 = {
  /** Who the plan is for, one line under its name. */
  description: string
  featuresHeading: string
  /** Only what this plan adds over the one before it. */
  features: string[]
  support: { level: string; detail: string }
}

/** Plans page v2 (SAFE_PRO_PLANS_V2): replaces the Stripe selling points and PLAN_FEATURES on its cards. */
export const PLAN_CONTENT_V2: Record<PlanNameV2, PlanContentV2> = {
  Starter: {
    description: 'Coordinate your team with a shared home for your Safes and transactions.',
    featuresHeading: 'Get started with Pro',
    features: [
      '10 sponsored transactions per month',
      'Advanced threat analysis',
      'Transaction simulation',
      'Shared address book',
      'Workspace activity log',
      'MFA authentication',
      'Builder API access',
    ],
    support: { level: 'Standard', detail: 'Help center and email' },
  },
  Business: {
    description: 'Scale with control. Delegate daily operations with hands-on help.',
    featuresHeading: 'Everything in Starter, plus',
    features: [
      '50 sponsored transactions per month',
      'Policy engine & spending limits',
      'Transaction proposers',
      'Account recovery',
      'Growth API access',
    ],
    support: { level: 'Priority', detail: '+ Guided onboarding' },
  },
  Enterprise: {
    description: 'Tailored to your organization, with custom capacity and commercial terms.',
    featuresHeading: 'Everything in Business, plus',
    features: [
      'No monthly sponsorship cap',
      'Custom Safe capacity',
      'Scale API access',
      'Tailored contract & billing terms',
    ],
    support: { level: 'Tailored', detail: '+ Guided onboarding' },
  },
}

export const getPlanContentV2 = (name: string): PlanContentV2 | undefined =>
  Object.hasOwn(PLAN_CONTENT_V2, name) ? PLAN_CONTENT_V2[name as PlanNameV2] : undefined

export const PLAN_CARD_COPY_V2 = {
  perSafeSuffix: '/Safe/mo',
  monthSuffix: '/mo',
  custom: 'Custom',
  customSuffix: 'Annual term',
  customLine: 'Pricing by agreement · Billed annually',
  supportLabel: 'Support',
  seatsLabel: 'Safe accounts for',
  billedMonthly: (total: string) => `${total}/mo billed monthly · excl. VAT`,
  billedYearly: (monthly: string, total: string) => `${monthly}/mo · ${total} billed yearly`,
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
