import type { Meta, StoryObj } from '@storybook/react'
import PlanStatusChip from './index'
import { PLAN_STATUS_MOCKS } from './mocks'

const meta = {
  title: 'Features/Gtf/PlanStatusChip',
  component: PlanStatusChip,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof PlanStatusChip>

export default meta
type Story = StoryObj<typeof meta>

export const StarterWithinLimit: Story = {
  args: { planStatus: PLAN_STATUS_MOCKS.starterWithin },
}

export const StarterLimitReached: Story = {
  args: { planStatus: PLAN_STATUS_MOCKS.starterLimit },
}

export const ProWithinLimit: Story = {
  args: { planStatus: PLAN_STATUS_MOCKS.proWithin },
}

export const ProApproachingLimit: Story = {
  args: { planStatus: PLAN_STATUS_MOCKS.proApproaching },
}

export const ProPaymentFailed: Story = {
  args: { planStatus: PLAN_STATUS_MOCKS.proFailed },
}
