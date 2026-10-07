import type { Meta, StoryObj } from '@storybook/react'
import { createMockStory } from '@/stories/mocks'
import { buildPlanTiers, toCurrentPlan } from '../planTiers'
import type { PlanSummary } from '../types'
import { PAID_PLANS, subscription } from '../plans.fixtures'
import CompareFeaturesCard from './CompareFeaturesCard'
import PlansV2 from './PlansV2'
import SalesPromptCard from './SalesPromptCard'

const setup = createMockStory({ scenario: 'efSafe', layout: 'paper', shadcn: true })

const trial = subscription()
const active = subscription({ status: 'active', hasPaymentMethod: true })
const TRIAL: PlanSummary = { name: 'Business', status: 'trialing', periodEndsAt: '2026-12-05T00:00:00Z', daysLeft: 14 }
const ACTIVE: PlanSummary = { ...TRIAL, status: 'active', daysLeft: null, hasPaymentMethod: true }

const paidPlan = (name: string, seats: number, price: number) => {
  const sub = subscription({
    status: 'active',
    hasPaymentMethod: true,
    metadata: { planName: name, FEATURE_SAFE_SEATS: String(seats) },
    plan: { ...subscription().plan, id: `price_${name}_${seats}_month`, name, currentPrice: price },
  })
  const summary: PlanSummary = { ...ACTIVE, name }
  return {
    plan: summary,
    canManage: true,
    tiers: buildPlanTiers(PAID_PLANS, { subscription: sub, seatsQuota: seats }),
    currentPlan: toCurrentPlan(sub, summary, false, seats),
  }
}

const meta = {
  title: 'Features/Spaces/Plans/PlansV2',
  component: PlansV2,
  parameters: setup.parameters,
  decorators: [setup.decorator],
  args: {
    plan: TRIAL,
    safeAccounts: { used: 16, quota: 20 },
    sponsoredTxs: { used: 46, quota: 50 },
    tiers: buildPlanTiers(PAID_PLANS, { subscription: trial, seatsQuota: 20 }),
    currentPlan: toCurrentPlan(trial, TRIAL, true, 20),
  },
} satisfies Meta<typeof PlansV2>

export default meta
type Story = StoryObj<typeof meta>

/** Business on free access with no payment method: the current card asks for one. */
export const BusinessTrial: Story = {}

/** A paid Business plan: the status card offers "Manage plan". */
export const BusinessActive: Story = {
  args: {
    plan: ACTIVE,
    canManage: true,
    tiers: buildPlanTiers(PAID_PLANS, { subscription: active, seatsQuota: 20 }),
    currentPlan: toCurrentPlan(active, ACTIVE, false, 20),
  },
}

/** A paid Starter plan: Business is the upgrade. */
export const StarterActive: Story = {
  args: { ...paidPlan('Starter', 2, 189), safeAccounts: { used: 2, quota: 2 }, sponsoredTxs: { used: 4, quota: 10 } },
}

/** Enterprise in force: its card sends changes to the account team. */
export const EnterpriseActive: Story = {
  args: { ...paidPlan('Enterprise', 50, 4900), safeAccounts: { used: 31, quota: 50 }, sponsoredTxs: null },
}

/** A Workspace without a plan: every card offers to subscribe. */
export const NoPlan: Story = {
  args: {
    plan: null,
    safeAccounts: null,
    sponsoredTxs: null,
    tiers: buildPlanTiers(PAID_PLANS),
    currentPlan: undefined,
  },
}

/** A member who is not an admin sees the plans without any button. */
export const MemberReadOnly: Story = { args: { readOnly: true } }

/** The comparison with every section open and the Business column marked current. */
export const CompareExpanded: Story = {
  render: () => <CompareFeaturesCard currentPlanName="Business" isExpanded onExpandedChange={() => {}} />,
}

/** The sales prompt under the comparison. */
export const SalesPrompt: Story = {
  render: () => <SalesPromptCard />,
}
