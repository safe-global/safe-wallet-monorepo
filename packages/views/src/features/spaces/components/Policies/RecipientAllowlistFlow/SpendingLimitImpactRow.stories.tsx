import type { Meta, StoryObj } from '@storybook/react'
import { Typography } from '@safe-global/views/components/ui/typography'
import SpendingLimitImpactRow from './SpendingLimitImpactRow'

const meta = {
  title: 'Features/Spaces/Policies/RecipientAllowlistFlow/SpendingLimitImpactRow',
  component: SpendingLimitImpactRow,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[560px] rounded-xl bg-muted p-4">
        <Story />
      </div>
    ),
  ],
  args: {
    spender: <Typography variant="paragraph-small-medium">Ops bot · Spending limit</Typography>,
    description: '500/day · USDC is in this allowlist',
    restricted: true,
  },
} satisfies Meta<typeof SpendingLimitImpactRow>

export default meta
type Story = StoryObj<typeof meta>

export const Restricted: Story = {}

export const NotAffected: Story = {
  args: {
    spender: <Typography variant="paragraph-small-medium">Payroll bot · Spending limit</Typography>,
    description: "1/week · ETH isn't in this allowlist",
    restricted: false,
  },
}
