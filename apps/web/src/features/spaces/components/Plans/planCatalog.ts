import type { PlanTier } from './types'

// TODO(safe-pro): plan copy lives here until the catalog exposes features (Plan.features / product.marketingFeatures).
export const PLAN_ORDER = ['Starter', 'Business', 'Enterprise'] as const

/** Largest yearly saving across plans. */
export const YEARLY_SAVINGS_LABEL = 'Save ~10%'

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
  Starter: ['10 sponsored transactions per month', ...SHARED_FEATURES, 'Builder API access'],
  Business: [
    '50 sponsored transactions per month',
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

export type PlanNameV2 = (typeof PLAN_ORDER)[number]

export const MEMBERS = 'Members'
export const WORKSPACE_2FA = 'Workspace 2FA'
export const NAMED_SUPPORT_CONTACT = 'Named support contact'

export type PlanContentV2 = {
  /** Who the plan is for, one line under its name. */
  description: string
  support: { level: string; detail: string }
}

/** Plans page v2 (SAFE_PRO_PLANS_V2): replaces the Stripe selling points and PLAN_FEATURES on its cards. */
export const PLAN_CONTENT_V2: Record<PlanNameV2, PlanContentV2> = {
  Starter: {
    description: 'Coordinate your team with a shared home for your Safes and transactions.',
    support: { level: 'Standard', detail: 'In-app and email' },
  },
  Business: {
    description: 'Scale with control. Delegate daily operations with hands-on help.',
    support: { level: 'Priority', detail: '+ Guided onboarding' },
  },
  Enterprise: {
    description: 'Tailored to your organization, with custom capacity and commercial terms.',
    support: { level: 'Tailored', detail: '+ Customized onboarding' },
  },
}

const isPlanNameV2 = (name: string): name is PlanNameV2 => PLAN_ORDER.some((plan) => plan === name)

type CardFeatureV2 = { from: PlanNameV2; label: string | Record<PlanNameV2, string> }

/** Card lists, in the compare table's section order. `from` is the first plan that includes it. */
export const CARD_FEATURES_V2: CardFeatureV2[] = [
  { from: 'Enterprise', label: 'Custom Safe capacity' },
  {
    from: 'Starter',
    label: {
      Starter: '10 eligible sponsored transactions per month, up to €5 each',
      Business: '50 eligible sponsored transactions per month, up to €5 each',
      Enterprise: 'Unlimited eligible sponsored transactions, up to €10 each',
    },
  },
  { from: 'Starter', label: 'Shared address book' },
  { from: 'Starter', label: 'Workspace activity log' },
  { from: 'Business', label: 'Spending limits' },
  { from: 'Business', label: 'Transaction proposers' },
  { from: 'Business', label: 'Self-custodial account recovery' },
  { from: 'Starter', label: 'Advanced threat analysis' },
  { from: 'Starter', label: 'Transaction simulation' },
  { from: 'Enterprise', label: NAMED_SUPPORT_CONTACT },
  { from: 'Enterprise', label: 'Tailored contract & billing terms' },
]

/** What a plan adds over the plan below it; a per-plan quota counts as added. The compare table lists everything. */
export const getCardFeaturesV2 = (name: string): string[] | undefined => {
  if (!isPlanNameV2(name)) return undefined
  return CARD_FEATURES_V2.filter(({ from, label }) => from === name || typeof label !== 'string').map(({ label }) =>
    typeof label === 'string' ? label : label[name],
  )
}

/** "What's included" on the first plan, "Everything in Starter, plus" on the ones after it. */
export const getFeaturesHeadingV2 = (name: string): string => {
  const rank = isPlanNameV2(name) ? PLAN_ORDER.indexOf(name) : 0
  return rank > 0 ? `Everything in ${PLAN_ORDER[rank - 1]}, plus` : PLAN_CARD_COPY_V2.featuresHeading
}

export const getPlanContentV2 = (name: string): PlanContentV2 | undefined =>
  isPlanNameV2(name) ? PLAN_CONTENT_V2[name] : undefined

export const PLAN_CARD_COPY_V2 = {
  yearlySavings: YEARLY_SAVINGS_LABEL,
  termsApply: 'Terms apply:',
  proTerms: 'Safe Pro Terms',
  billingCycleLabel: 'Billing cycle',
  monthly: 'Monthly',
  yearly: 'Yearly',
  currentPlan: 'Current plan',
  accountTeam: 'Change via your account team',
  talkToSales: 'Talk to sales',
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

export const PAY_GAS_FROM_SAFE = 'Pay gas from your Safe'

/** `true` is included, `false` is not; a string names what the plan gets. */
export type CompareValueV2 = boolean | string

export type CompareRowV2 = {
  feature: string
  /** Unreleased: a "Soon" chip next to the feature name. */
  isComingSoon?: boolean
  /** Partner add-on, sold separately: each plan's value links to sales. */
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

export const COMPARE_COPY_V2 = {
  title: 'Compare all features',
  subtitle: 'Limits, operations, security and support for every plan',
  featureColumn: 'Features',
  current: 'Current',
  soon: 'Soon',
  included: 'Included',
  notIncluded: 'Not included',
  showAll: 'Expand table',
  soldSeparately: 'Sold separately',
}

/** Unreleased: listed on the cards with a "Soon" chip, never in the compare table. */
export const COMING_SOON_V2: Pick<CompareRowV2, 'feature' | 'values'>[] = [
  { feature: PAY_GAS_FROM_SAFE, values: fromBusiness },
  { feature: SAFENET_CHECKS, values: fromBusiness },
  { feature: 'More policies', values: fromBusiness },
]

/** The collapsed "Compare all features" card shows the first few rows. */
export const COMPARE_SECTIONS_V2: CompareSectionV2[] = [
  {
    title: 'Limits',
    rows: [
      { feature: 'Workspaces', values: every('1') },
      { feature: MEMBERS, values: every('Unlimited') },
      { feature: 'Safe accounts', values: { Starter: '2', Business: '5, 10 or 20', Enterprise: 'More than 20' } },
      {
        feature: 'Eligible sponsored transactions per month',
        values: { Starter: '10', Business: '50', Enterprise: 'Unlimited' },
      },
      { feature: 'Sponsoring limit per transaction', values: { Starter: '€5', Business: '€5', Enterprise: '€10' } },
    ],
  },
  {
    title: 'Operations',
    rows: [
      { feature: 'Shared address book', values: every(true) },
      { feature: 'Workspace activity log', values: every(true) },
      { feature: 'Nested Safe support', values: every(true) },
      { feature: 'Spending limits', values: fromBusiness },
      { feature: 'Transaction proposers', values: fromBusiness },
      { feature: 'Self-custodial account recovery', values: fromBusiness },
    ],
  },
  {
    title: 'Security & Safe Shield',
    rows: [
      { feature: WORKSPACE_2FA, values: every(true) },
      { feature: 'Security Hub', values: every(true) },
      { feature: 'Advanced threat analysis', values: every(true) },
      { feature: 'Transaction simulation', values: every(true) },
      {
        feature: SAFENET_CHECKS,
        values: { Starter: 'Pay per transaction', Business: true, Enterprise: true },
        isComingSoon: true,
      },
    ],
  },
  {
    title: 'Support & service levels',
    rows: [
      { feature: 'In-app and email support', values: every(true) },
      { feature: 'Priority handling within the same severity', values: fromBusiness },
      { feature: NAMED_SUPPORT_CONTACT, values: enterpriseOnly },
      { feature: 'Shared support channel', values: enterpriseOnly },
      {
        feature: 'Defined escalation path',
        values: { Starter: false, Business: 'By separate agreement', Enterprise: true },
      },
      {
        feature: 'Guided onboarding',
        values: { Starter: false, Business: 'One 60-minute session', Enterprise: 'Tailored to your needs' },
      },
    ],
  },
  {
    title: 'Add-ons',
    rows: [{ feature: 'Hypernative Guardian', values: every(COMPARE_COPY_V2.soldSeparately), isAddOn: true }],
  },
]

/** Unreleased features a plan will get that the plan below it will not; the card lists them after what is included. */
export const getCardComingSoonV2 = (name: string): string[] | undefined => {
  if (!isPlanNameV2(name)) return undefined
  const below = PLAN_ORDER[PLAN_ORDER.indexOf(name) - 1]
  return COMING_SOON_V2.filter((row) => row.values[name] === true && (!below || row.values[below] !== true)).map(
    (row) => row.feature,
  )
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
