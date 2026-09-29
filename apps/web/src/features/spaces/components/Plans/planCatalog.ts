import type { PlanTier } from './types'

// TODO(safe-pro): plan copy lives here until the catalog exposes features (Plan.features / product.marketingFeatures).
export const PLAN_ORDER = ['Starter', 'Business', 'Enterprise'] as const

/** Largest yearly saving across plans. */
export const YEARLY_SAVINGS_PERCENT = 13

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

export type PlanNameV2 = (typeof PLAN_ORDER)[number]

export const UNLIMITED_MEMBERS = 'Unlimited Workspace members'
export const WORKSPACE_2FA = 'Workspace 2FA'

export type PlanContentV2 = {
  /** Who the plan is for, one line under its name. */
  description: string
  featuresHeading: string
  /** On top of the previous plan's features. */
  additionalFeatures: string[]
  support: { level: string; detail: string }
}

/** Plans page v2 (SAFE_PRO_PLANS_V2): replaces the Stripe selling points and PLAN_FEATURES on its cards. */
export const PLAN_CONTENT_V2: Record<PlanNameV2, PlanContentV2> = {
  Starter: {
    description: 'Coordinate your team with a shared home for your Safes and transactions.',
    featuresHeading: 'Get started with Pro',
    additionalFeatures: [
      '10 sponsored transactions per month',
      UNLIMITED_MEMBERS,
      'Advanced threat analysis',
      'Transaction simulation',
      'Shared address book',
      'Workspace activity log',
      WORKSPACE_2FA,
      'Builder API access',
    ],
    support: { level: 'Standard', detail: 'Help center and email' },
  },
  Business: {
    description: 'Scale with control. Delegate daily operations with hands-on help.',
    featuresHeading: 'Everything in Starter, plus',
    additionalFeatures: [
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
    additionalFeatures: [
      'Unlimited sponsored transactions',
      'Custom Safe capacity',
      'Scale API access',
      'Tailored contract & billing terms',
    ],
    support: { level: 'Tailored', detail: '+ Guided onboarding' },
  },
}

const isPlanNameV2 = (name: string): name is PlanNameV2 => PLAN_ORDER.some((plan) => plan === name)

export const getPlanContentV2 = (name: string): PlanContentV2 | undefined =>
  isPlanNameV2(name) ? PLAN_CONTENT_V2[name] : undefined

export const PLAN_CARD_COPY_V2 = {
  yearlySavings: `Save ~${YEARLY_SAVINGS_PERCENT}%`,
  billingCycleLabel: 'Billing cycle',
  monthly: 'Monthly',
  yearly: 'Yearly',
  currentPlan: 'Current plan',
  accountTeam: 'Change via your account team',
  perSafeSuffix: '/Safe/mo',
  monthSuffix: '/mo',
  custom: 'Custom',
  customSuffix: 'Annual term',
  customLine: 'Pricing by agreement · Billed annually',
  supportLabel: 'Support',
  seatsLabel: 'Safe accounts for',
  billedMonthly: (total: string) => `${total}/mo billed monthly · excl. VAT`,
  billedYearly: (monthly: string, total: string) => `${monthly}/mo · ${total} billed yearly`,
} as const

export const SAFENET_CHECKS = 'Safenet checks'

export const PAY_FEES_FROM_SAFE = 'Pay fees from Safe accounts'

/** `true` is included, `false` is not; a string names what the plan gets. */
export type CompareValueV2 = boolean | string

export type CompareRowV2 = {
  feature: string
  /** Unreleased: shows "Soon" instead of per-plan values. */
  isComingSoon?: boolean
  values?: Record<PlanNameV2, CompareValueV2>
}

export type CompareSectionV2 = { title: string; rows: CompareRowV2[] }

const every = (value: CompareValueV2): Record<PlanNameV2, CompareValueV2> => ({
  Starter: value,
  Business: value,
  Enterprise: value,
})
const fromBusiness: Record<PlanNameV2, CompareValueV2> = { Starter: false, Business: true, Enterprise: true }

/** The collapsed "Compare all features" card shows only the first section. */
export const COMPARE_SECTIONS_V2: CompareSectionV2[] = [
  {
    title: 'Every Pro plan',
    rows: [
      { feature: UNLIMITED_MEMBERS, values: every(true) },
      { feature: WORKSPACE_2FA, values: every(true) },
      { feature: 'Security Hub', values: every(true) },
    ],
  },
  {
    title: 'Security',
    rows: [
      { feature: 'Advanced threat analysis', values: every(true) },
      { feature: 'Transaction simulation', values: every(true) },
      { feature: 'Hypernative threat monitoring', values: every('Add-on') },
      { feature: SAFENET_CHECKS, isComingSoon: true },
    ],
  },
  {
    title: 'Operations',
    rows: [
      { feature: 'Shared address book', values: every(true) },
      { feature: 'Workspace activity log', values: every(true) },
      { feature: 'Policy engine & spending limits', values: fromBusiness },
      { feature: 'Transaction proposers', values: fromBusiness },
      { feature: 'Account recovery', values: fromBusiness },
      { feature: 'API access', values: { Starter: 'Builder', Business: 'Growth', Enterprise: 'Scale' } },
      { feature: PAY_FEES_FROM_SAFE, isComingSoon: true },
    ],
  },
  {
    title: 'Support',
    rows: [
      {
        feature: 'Support',
        values: {
          Starter: PLAN_CONTENT_V2.Starter.support.level,
          Business: PLAN_CONTENT_V2.Business.support.level,
          Enterprise: PLAN_CONTENT_V2.Enterprise.support.level,
        },
      },
      { feature: 'Guided onboarding', values: fromBusiness },
      {
        feature: 'Contract & billing terms',
        values: { Starter: 'Standard', Business: 'Standard', Enterprise: 'Tailored' },
      },
    ],
  },
  {
    title: 'Limits',
    rows: [
      { feature: 'Safe accounts', values: { Starter: '2', Business: '5, 10 or 20', Enterprise: 'More than 20' } },
      {
        feature: 'Sponsored transactions per month',
        values: { Starter: '10', Business: '50', Enterprise: 'Unlimited' },
      },
    ],
  },
]

export const COMPARE_COPY_V2 = {
  title: 'Compare all features',
  subtitle: 'Security, operations, support and limits for every plan',
  featureColumn: 'Feature',
  current: 'Current',
  soon: 'Soon',
  included: 'Included',
  notIncluded: 'Not included',
  showAll: 'Show all features',
}

export const PLAN_EXTRAS_V2 = {
  comingSoon: {
    tag: 'Coming soon',
    title: 'More ways to execute with confidence',
    items: [SAFENET_CHECKS, PAY_FEES_FROM_SAFE, 'More policies'],
    action: 'Request updates',
  },
  addOn: {
    tag: 'Optional add-on',
    title: 'Hypernative',
    description:
      'Real-time threat monitoring and prevention for your Safes, from our security partner. Available on every plan, sold separately.',
    action: 'Discuss add-on',
  },
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
