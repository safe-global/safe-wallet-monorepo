import type { Meta, StoryObj } from '@storybook/react'
import { SwapOrderExtraActionsWarning } from './index'

const meta = {
  title: 'Features/Swap/SwapOrderExtraActionsWarning',
  component: SwapOrderExtraActionsWarning,
  decorators: [
    (Story) => (
      <div className="bg-background rounded-lg p-4">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof SwapOrderExtraActionsWarning>

export default meta
type Story = StoryObj<typeof meta>

export const OneAction: Story = {
  args: { count: 1 },
}

export const SeveralActions: Story = {
  args: { count: 3 },
}
