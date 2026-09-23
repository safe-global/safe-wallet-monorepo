import type { Meta, StoryObj } from '@storybook/react'
import { mockMultiSpenderPolicy, mockSpendingLimitPolicy } from '../../../mocks/policies'
import SpendingLimits from './SpendingLimits'

const meta = {
  title: 'Features/Spaces/Policies/SpendingLimitDrawer/components/SpendingLimits',
  component: SpendingLimits,
  parameters: { layout: 'centered' },
  decorators: [(Story) => <div className="w-[400px]">{Story()}</div>],
} satisfies Meta<typeof SpendingLimits>

export default meta
type Story = StoryObj<typeof SpendingLimits>

/** An active policy: every token shows how much headroom is left and when it resets. */
export const Active: Story = {
  args: { spenders: mockSpendingLimitPolicy().data.spenders, showUsage: true },
}

/** A pending policy enforces nothing yet, so amounts appear without usage. */
export const Pending: Story = {
  args: { spenders: mockSpendingLimitPolicy().data.spenders, showUsage: false },
}

/** Each spender gets its own card, including one with a token CGW has no logo for. */
export const MultiSpender: Story = {
  args: { spenders: mockMultiSpenderPolicy().data.spenders, showUsage: true },
}
