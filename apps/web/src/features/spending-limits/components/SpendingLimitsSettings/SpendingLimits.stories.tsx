import type { Meta, StoryObj } from '@storybook/react'
import { NoSpendingLimits } from './NoSpendingLimits'

const meta: Meta<typeof NoSpendingLimits> = {
  title: 'Components/Settings/SpendingLimits/NoSpendingLimits',
  component: NoSpendingLimits,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div className="bg-background max-w-[600px] rounded-lg p-8">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default empty state for spending limits.
 * Shows instructions for setting up spending limits.
 */
export const Default: Story = {}
