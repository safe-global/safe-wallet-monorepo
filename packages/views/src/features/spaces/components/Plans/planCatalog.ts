import type { PlanTier } from './types'

export const PLAN_ORDER = ['Starter', 'Business', 'Enterprise'] as const

/** The plan the trial and lapsed-Workspace modals lead with. */
export const RECOMMENDED_PLAN = 'Business'

type PlanName = (typeof PLAN_ORDER)[number]

export const COMPARE_FEATURES_ID = 'compare-features'

export type CompareValue = boolean | string

export type CompareRow = {
  feature: string
  isComingSoon?: boolean
  isAddOn?: boolean
  values: Record<PlanName, CompareValue>
}

export type CompareSection = {
  title: string
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

export const COMPARE_SECTIONS: CompareSection[] = [
  {
    title: 'Coming soon',
    hoverEmoji: '👀',
    rows: [
      { feature: 'Safenet checks', values: fromBusiness, isComingSoon: true },
      { feature: 'More policies', values: fromBusiness, isComingSoon: true },
      { feature: 'Pay gas fees from Safe account', values: fromBusiness, isComingSoon: true },
    ],
  },
  {
    title: 'Limits',
    rows: [
      { feature: 'Workspaces', values: every('1') },
      { feature: 'Members', values: every('Unlimited') },
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
      { feature: 'Policies', values: fromBusiness },
    ],
  },
  {
    title: 'Security & Safe Shield',
    rows: [
      { feature: 'Workspace 2FA', values: every(true) },
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
      { feature: 'Named support contact', values: enterpriseOnly },
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
  copy: {
    subtitle: 'Tailored to your organization, with custom capacity and commercial terms.',
    supportLevel: 'Tailored',
    supportDetail: '+ Customized onboarding',
  },
  features: [
    'Unlimited sponsored transactions',
    'Shared address book',
    'Activity log',
    'Advanced threat analysis',
    'Transaction simulation',
    'Workspace 2FA',
    'Policies',
    'Custom Safe capacity',
    'Multiple workspaces',
    'Tailored contract & billing terms',
  ],
}
