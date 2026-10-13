import type { PlanTier } from './types'

export const PLAN_ORDER = ['Starter', 'Business', 'Enterprise'] as const

/** The plan the trial and lapsed-Workspace modals lead with. */
export const RECOMMENDED_PLAN = 'Business'

type PlanName = (typeof PLAN_ORDER)[number]

export const MEMBERS = 'Members'
export const WORKSPACE_2FA = 'Workspace 2FA'
export const NAMED_SUPPORT_CONTACT = 'Named support contact'
export const POLICIES = 'Policies'
export const PAY_GAS_FROM_SAFE = 'Pay gas fees from Safe account'

export type PlanContent = {
  /** Who the plan is for, one line under its name. */
  description: string
  /** What the card lists, per the Plans tab feature list. */
  features: string[]
  support: { level: string; detail: string }
}

const EVERY_PLAN = [
  'Shared address book',
  'Activity log',
  'Advanced threat analysis',
  'Transaction simulation',
  WORKSPACE_2FA,
]

/** Replaces the Stripe selling points on the plan cards. */
export const PLAN_CONTENT: Partial<Record<string, PlanContent>> = {
  Starter: {
    description: 'Coordinate your team with a shared home for your Safes and transactions.',
    features: ['10 sponsored transactions per month', ...EVERY_PLAN],
    support: { level: 'Standard', detail: 'In-app and email' },
  },
  Business: {
    description: 'Scale with control. Delegate daily operations with hands-on help.',
    features: ['50 sponsored transactions per month', ...EVERY_PLAN, POLICIES],
    support: { level: 'Priority', detail: '+ Guided onboarding' },
  },
  Enterprise: {
    description: 'Tailored to your organization, with custom capacity and commercial terms.',
    features: [
      'Unlimited sponsored transactions',
      ...EVERY_PLAN,
      POLICIES,
      'Custom Safe capacity',
      'Tailored contract & billing terms',
    ],
    support: { level: 'Tailored', detail: '+ Customized onboarding' },
  },
}

export const SAFENET_CHECKS = 'Safenet checks'

/** `true` is included, `false` is not; a string names what the plan gets. */
export type CompareValue = boolean | string

export type CompareRow = {
  feature: string
  /** Unreleased: a "Soon" chip next to the feature name. */
  isComingSoon?: boolean
  /** Partner add-on: a "Learn more" link next to the feature opens its signup. */
  isAddOn?: boolean
  values: Record<PlanName, CompareValue>
}

export type CompareSection = {
  title: string
  /** Shown next to the title while the compare card is hovered. */
  hoverEmoji?: string
  rows: CompareRow[]
}

const every = (value: CompareValue): Record<PlanName, CompareValue> => ({
  Starter: value,
  Business: value,
  Enterprise: value,
})
const fromBusiness: Record<PlanName, CompareValue> = { Starter: false, Business: true, Enterprise: true }
const enterpriseOnly: Record<PlanName, CompareValue> = { Starter: false, Business: false, Enterprise: true }

/** The collapsed "Compare all features" card shows the first few rows. */
export const COMPARE_SECTIONS: CompareSection[] = [
  {
    title: 'Coming soon',
    hoverEmoji: '👀',
    rows: [
      { feature: SAFENET_CHECKS, values: fromBusiness, isComingSoon: true },
      { feature: 'More policies', values: fromBusiness, isComingSoon: true },
      { feature: PAY_GAS_FROM_SAFE, values: fromBusiness, isComingSoon: true },
    ],
  },
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
      { feature: POLICIES, values: fromBusiness },
    ],
  },
  {
    title: 'Security & Safe Shield',
    rows: [
      { feature: WORKSPACE_2FA, values: every(true) },
      { feature: 'Security Hub', values: every(true) },
      { feature: 'Advanced threat analysis', values: every(true) },
      { feature: 'Transaction simulation', values: every(true) },
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
    rows: [{ feature: 'Hypernative Guardian', values: every(true), isAddOn: true }],
  },
]

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
