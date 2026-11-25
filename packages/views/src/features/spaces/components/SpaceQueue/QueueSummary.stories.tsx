import type { Meta, StoryObj } from '@storybook/react'
import QueueSummary from './QueueSummary'

const meta = {
  title: 'Features/Spaces/Transactions/QueueSummary',
  component: QueueSummary,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-40 text-sm">
        <Story />
      </div>
    ),
  ],
  args: { children: 'safeTransferFromWithPermitAndCallback', defaultOpen: true },
} satisfies Meta<typeof QueueSummary>

export default meta
type Story = StoryObj<typeof meta>

/** A long method truncates on the row; the tooltip has it whole */
export const LongMethod: Story = {}

export const WithHint: Story = { args: { children: '2 WETH → USDC', hint: 'Limit order' } }
