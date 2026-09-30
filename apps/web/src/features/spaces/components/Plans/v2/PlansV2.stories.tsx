import type { Meta, StoryObj } from '@storybook/react'
import type { Subscription } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import { createMockStory } from '@/stories/mocks'
import type { PlanGroup, PlanOffer } from '../../../hooks/billing/types'
import { buildPlanTiers, toCurrentPlan } from '../planTiers'
import type { PlanSummary } from '../types'
import CompareFeaturesCard from './CompareFeaturesCard'
import PlansV2 from './PlansV2'

const setup = createMockStory({ scenario: 'efSafe', layout: 'paper', shadcn: true })

const offer = (planName: string, seats: number, cents: number, billingCycle: 'month' | 'year'): PlanOffer => ({
  paymentLinkId: `pl_${planName}_${seats}_${billingCycle}`,
  priceId: `price_${planName}_${seats}_${billingCycle}`,
  planName,
  seats,
  price: cents / 100,
  currency: 'eur',
  billingCycle,
  trialPeriodDays: null,
})

// Monthly prices match the Figma frame; the yearly ones are placeholders about 13% below twelve months.
const STARTER: PlanGroup = {
  name: 'Starter',
  offers: [offer('Starter', 2, 18_900, 'month'), offer('Starter', 2, 197_300, 'year')],
}
const BUSINESS: PlanGroup = {
  name: 'Business',
  offers: [
    offer('Business', 5, 66_900, 'month'),
    offer('Business', 10, 109_900, 'month'),
    offer('Business', 20, 166_900, 'month'),
    offer('Business', 20, 1_742_400, 'year'),
  ],
}

const businessSubscription = (status: 'trialing' | 'active'): Subscription => ({
  id: 'sub_1',
  customerId: 'cus_1',
  upstreamCustomerId: 'cus_upstream_1',
  status,
  createdAt: 0,
  startAt: 0,
  cancelledAt: null,
  cancelAt: null,
  hasPaymentMethod: false,
  metadata: { planName: 'Business', FEATURE_SAFE_SEATS: '20' },
  plan: {
    id: 'price_Business_20_month',
    name: 'Business',
    currentPrice: 1669,
    originalPrice: null,
    paymentMethod: 'fiat',
    currency: 'eur',
    billingCycle: 'month',
    features: [],
    type: 'standard',
    product: null,
  },
})

const TRIAL: PlanSummary = { name: 'Business', status: 'trialing', periodEndsAt: '2026-12-05T00:00:00Z', daysLeft: 14 }

const meta = {
  title: 'Features/Spaces/Plans/PlansV2',
  component: PlansV2,
  parameters: setup.parameters,
  decorators: [setup.decorator],
  args: {
    plan: TRIAL,
    safeAccounts: { used: 16, quota: 20 },
    sponsoredTxs: { used: 46, quota: 50 },
    tiers: buildPlanTiers([STARTER, BUSINESS], {
      subscription: businessSubscription('trialing'),
      seatsQuota: 20,
    }),
    currentPlan: toCurrentPlan(businessSubscription('trialing'), TRIAL, true, 20),
  },
} satisfies Meta<typeof PlansV2>

export default meta
type Story = StoryObj<typeof meta>

/** Business on free access with no payment method: the current card asks for one. */
export const BusinessTrial: Story = {}

/** A Workspace without a plan: every card offers to subscribe. */
export const NoPlan: Story = {
  args: {
    plan: null,
    safeAccounts: null,
    sponsoredTxs: null,
    tiers: buildPlanTiers([STARTER, BUSINESS]),
    currentPlan: undefined,
  },
}

/** A member who is not an admin sees the plans without any button. */
export const MemberReadOnly: Story = { args: { readOnly: true } }

/** The comparison with every section open and the Business column marked current. */
export const CompareExpanded: Story = {
  render: () => <CompareFeaturesCard currentPlanName="Business" isExpanded onExpandedChange={() => {}} />,
}
