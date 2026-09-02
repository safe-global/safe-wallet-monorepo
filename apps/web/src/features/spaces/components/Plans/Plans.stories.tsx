import type { Meta, StoryObj } from '@storybook/react'
import Plans from './index'
import { TIERS, TRIAL_PLANS } from './fixtures'

const meta = {
  title: 'Features/Spaces/Plans',
  component: Plans,
  tags: ['autodocs'],
} satisfies Meta<typeof Plans>

export default meta
type Story = StoryObj<typeof meta>

export const Trial: Story = {
  args: { data: TRIAL_PLANS },
}

export const ActivePlan: Story = {
  args: {
    data: {
      ...TRIAL_PLANS,
      plan: { name: 'Business', status: 'active', periodEndsAt: '2026-10-06T00:00:00Z' },
      sponsoredTxs: { used: 52, quota: 50 },
    },
  },
}

export const Free: Story = {
  args: {
    data: {
      plan: null,
      safeAccounts: { used: 1, quota: 1 },
      sponsoredTxs: { used: 0, quota: null },
      tiers: TIERS.map((tier) => ({ ...tier, isCurrent: false })),
    },
  },
}
