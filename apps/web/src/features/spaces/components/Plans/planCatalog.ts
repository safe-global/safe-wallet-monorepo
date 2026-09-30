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
export const MULTIPLE_WORKSPACES = 'Multiple Workspaces'
export const NAMED_ACCOUNT_MANAGER = 'Named account manager'
export const SLAS = 'SLAs'

export type PlanContentV2 = {
  /** Who the plan is for, one line under its name. */
  description: string
  support: { level: string; detail: string }
}

/** Plans page v2 (SAFE_PRO_PLANS_V2): replaces the Stripe selling points and PLAN_FEATURES on its cards. */
export const PLAN_CONTENT_V2: Record<PlanNameV2, PlanContentV2> = {
  Starter: {
    description: 'Coordinate your team with a shared home for your Safes and transactions.',
    support: { level: 'Standard', detail: 'Help center and email' },
  },
  Business: {
    description: 'Scale with control. Delegate daily operations with hands-on help.',
    support: { level: 'Priority', detail: '+ Guided onboarding' },
  },
  Enterprise: {
    description: 'Tailored to your organization, with custom capacity and commercial terms.',
    support: { level: 'Tailored', detail: '+ Guided onboarding' },
  },
}

const isPlanNameV2 = (name: string): name is PlanNameV2 => PLAN_ORDER.some((plan) => plan === name)

type CardFeatureV2 = { from: PlanNameV2; label: string | Record<PlanNameV2, string> }

/** Card lists, in order. `from` is the first plan that includes it. */
export const CARD_FEATURES_V2: CardFeatureV2[] = [
  {
    from: 'Starter',
    label: {
      Starter: '10 sponsored transactions per month',
      Business: '50 sponsored transactions per month',
      Enterprise: 'Unlimited sponsored transactions',
    },
  },
  { from: 'Starter', label: UNLIMITED_MEMBERS },
  { from: 'Starter', label: 'Advanced threat analysis' },
  { from: 'Starter', label: 'Transaction simulation' },
  { from: 'Starter', label: 'Shared address book' },
  { from: 'Starter', label: 'Workspace activity log' },
  { from: 'Business', label: 'Policy engine & spending limits' },
  { from: 'Business', label: 'Transaction proposers' },
  { from: 'Business', label: 'Account recovery' },
  { from: 'Enterprise', label: 'Custom Safe capacity' },
  { from: 'Enterprise', label: 'Tailored contract & billing terms' },
  { from: 'Enterprise', label: MULTIPLE_WORKSPACES },
  { from: 'Enterprise', label: NAMED_ACCOUNT_MANAGER },
  { from: 'Enterprise', label: SLAS },
]

export type CardFeatureItemV2 = { label: string; isInherited: boolean }

/** Everything a plan includes: what it adds first, then what it keeps from lower plans. A per-plan quota counts as added. */
export const getCardFeatureItemsV2 = (name: string): CardFeatureItemV2[] | undefined => {
  if (!isPlanNameV2(name)) return undefined
  const rank = PLAN_ORDER.indexOf(name)
  const items = CARD_FEATURES_V2.filter(({ from }) => PLAN_ORDER.indexOf(from) <= rank).map(({ from, label }) => ({
    label: typeof label === 'string' ? label : label[name],
    isInherited: typeof label === 'string' && from !== name,
  }))
  return [...items.filter((item) => !item.isInherited), ...items.filter((item) => item.isInherited)]
}

export const getCardFeaturesV2 = (name: string): string[] | undefined =>
  getCardFeatureItemsV2(name)?.map((item) => item.label)

/** "What's included" on the first plan, "Everything in Starter, plus" on the ones after it. */
export const getFeaturesHeadingV2 = (name: string): string => {
  const rank = isPlanNameV2(name) ? PLAN_ORDER.indexOf(name) : 0
  return rank > 0 ? `Everything in ${PLAN_ORDER[rank - 1]}, plus` : PLAN_CARD_COPY_V2.featuresHeading
}

export const getPlanContentV2 = (name: string): PlanContentV2 | undefined =>
  isPlanNameV2(name) ? PLAN_CONTENT_V2[name] : undefined

export const PLAN_CARD_COPY_V2 = {
  yearlySavings: `save ${YEARLY_SAVINGS_PERCENT}%`,
  billingCycleLabel: 'Billing cycle',
  monthly: 'Monthly',
  yearly: 'Yearly',
  currentPlan: 'Current plan',
  accountTeam: 'Change via your account team',
  custom: 'Custom',
  customSuffix: 'Annual term',
  customLine: 'Pricing by agreement · Billed annually',
  featuresHeading: "What's included",
  supportLabel: 'Support',
  seatsLabel: 'Safe accounts for',
  billedMonthly: 'Billed monthly · excl. VAT',
  billedYearly: 'Billed yearly · excl. VAT',
  perSafe: (amount: string) => `${amount} per Safe account/mo`,
} as const

export const SAFENET_CHECKS = 'Safenet checks'

export const PAY_FEES_FROM_SAFE = 'Pay fees from Safe accounts'

/** `true` is included, `false` is not; a string names what the plan gets. */
export type CompareValueV2 = boolean | string

export type CompareRowV2 = {
  feature: string
  /** Unreleased: a "Soon" chip next to the feature name. */
  isComingSoon?: boolean
  /** Partner add-on, sold separately: the partner's icon and a sales link. */
  isAddOn?: boolean
  values: Record<PlanNameV2, CompareValueV2>
}

export type CompareSectionV2 = { title: string; rows: CompareRowV2[] }

const every = (value: CompareValueV2): Record<PlanNameV2, CompareValueV2> => ({
  Starter: value,
  Business: value,
  Enterprise: value,
})
const fromBusiness: Record<PlanNameV2, CompareValueV2> = { Starter: false, Business: true, Enterprise: true }
const enterpriseOnly: Record<PlanNameV2, CompareValueV2> = { Starter: false, Business: false, Enterprise: true }

/** The collapsed "Compare all features" card shows the first few rows. */
export const COMPARE_SECTIONS_V2: CompareSectionV2[] = [
  {
    title: 'Coming soon',
    rows: [
      { feature: PAY_FEES_FROM_SAFE, values: every(true), isComingSoon: true },
      { feature: SAFENET_CHECKS, values: fromBusiness, isComingSoon: true },
      { feature: 'More policies', values: every(true), isComingSoon: true },
    ],
  },
  {
    title: 'Operations',
    rows: [
      { feature: UNLIMITED_MEMBERS, values: every(true) },
      { feature: 'Shared address book', values: every(true) },
      { feature: 'Workspace activity log', values: every(true) },
      { feature: 'Policy engine & spending limits', values: fromBusiness },
      { feature: 'Transaction proposers', values: fromBusiness },
      { feature: 'Account recovery', values: fromBusiness },
      { feature: MULTIPLE_WORKSPACES, values: enterpriseOnly },
      { feature: 'API access', values: { Starter: 'Builder', Business: 'Growth', Enterprise: 'Scale' } },
    ],
  },
  {
    title: 'Security',
    rows: [
      { feature: WORKSPACE_2FA, values: every(true) },
      { feature: 'Security Hub', values: every(true) },
      { feature: 'Advanced threat analysis', values: every(true) },
      { feature: 'Transaction simulation', values: every(true) },
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
      { feature: NAMED_ACCOUNT_MANAGER, values: enterpriseOnly },
      { feature: SLAS, values: enterpriseOnly },
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
  {
    title: 'Add-ons',
    rows: [{ feature: 'Hypernative threat monitoring', values: every('Add-on'), isAddOn: true }],
  },
]

export const COMPARE_COPY_V2 = {
  title: 'Compare all features',
  subtitle: 'Operations, security, support and limits for every plan',
  featureColumn: 'Features',
  current: 'Current',
  soon: 'Soon',
  included: 'Included',
  notIncluded: 'Not included',
  showAll: 'Expand table',
  discussAddOn: 'Discuss add-on',
}

export const SALES_PROMPT_V2 = {
  prompt: 'Not sure which plan fits?',
  action: 'Talk to sales',
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
