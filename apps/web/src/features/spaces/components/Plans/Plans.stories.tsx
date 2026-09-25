import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import type { Subscription } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import { withMockProvider } from '@/storybook/preview'
import type { PlanGroup, PlanOffer, PlanSummary } from '../../hooks/billing/types'
import { buildPlanTiers } from './planTiers'
import type { CurrentPlan } from './types'
import Plans from './index'

const offer = (planName: string, seats: number, price: number, billingCycle: 'month' | 'year'): PlanOffer => ({
  paymentLinkId: `pl_${planName}_${seats}_${billingCycle}`,
  priceId: `price_${planName}_${seats}_${billingCycle}`,
  planName,
  seats,
  price,
  currency: 'eur',
  billingCycle,
  trialPeriodDays: null,
})

const PAID_PLANS: PlanGroup[] = [
  { name: 'Starter', offers: [offer('Starter', 2, 149, 'month'), offer('Starter', 2, 1608, 'year')] },
  {
    name: 'Business',
    offers: [
      offer('Business', 10, 299, 'month'),
      offer('Business', 50, 999, 'month'),
      offer('Business', 10, 3228, 'year'),
    ],
  },
]

const SUBSCRIPTION: Subscription = {
  id: 'sub_1',
  customerId: 'cus_1',
  upstreamCustomerId: 'cus_stripe_1',
  status: 'active',
  createdAt: 0,
  startAt: 0,
  cancelledAt: null,
  cancelAt: null,
  plan: {
    id: 'price_Business_20_month',
    name: 'Business',
    currentPrice: 499,
    originalPrice: null,
    paymentMethod: 'fiat',
    currency: 'eur',
    features: [],
    billingCycle: 'month',
    type: 'standard',
    product: null,
  },
}

const PERIOD_END = '2026-12-06T00:00:00Z'
const ACTIVE: PlanSummary = { name: 'Business', status: 'active', periodEndsAt: PERIOD_END, daysLeft: 60 }
const trial = (daysLeft: number): PlanSummary => ({ ...ACTIVE, status: 'trialing', daysLeft })
const current = (isTrialing: boolean): CurrentPlan => ({
  name: 'Business',
  price: 499,
  currency: 'eur',
  billingCycle: 'month',
  isTrialing,
  periodEndsAt: PERIOD_END,
  seatsLabel: '20 Safe accounts',
})
const withCurrent = buildPlanTiers(PAID_PLANS, { subscription: SUBSCRIPTION, seatsQuota: 20 })

const meta = {
  title: 'Features/Spaces/Plans',
  component: Plans,
  // The seats selector and tooltips portal into `.shadcn-scope`, which only the provider sets up.
  decorators: [withMockProvider({ shadcn: true })],
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    plan: ACTIVE,
    safeAccounts: { used: 6, quota: 20 },
    sponsoredTxs: { used: 11, quota: 50 },
    tiers: withCurrent,
    currentPlan: current(false),
    onManage: fn(),
    onSubscribe: fn(),
  },
} satisfies Meta<typeof Plans>

export default meta
type Story = StoryObj<typeof meta>

export const Active: Story = {}

export const Trial: Story = {
  args: { plan: trial(20), currentPlan: current(true) },
}

export const TrialEndingSoon: Story = {
  args: { plan: trial(5), currentPlan: current(true) },
}

export const ExhaustedMeter: Story = {
  args: { safeAccounts: { used: 20, quota: 20 } },
}

export const ReadOnly: Story = {
  args: { readOnly: true },
}

export const NoPlan: Story = {
  args: {
    plan: null,
    safeAccounts: null,
    sponsoredTxs: null,
    tiers: buildPlanTiers(PAID_PLANS),
    currentPlan: undefined,
  },
}
