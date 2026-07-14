import type { Meta, StoryObj } from '@storybook/react'

import { NoSpendingLimits } from './NoSpendingLimits'

const meta: Meta<typeof NoSpendingLimits> = {
  title: 'Features/SpendingLimits/NoSpendingLimits',
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
 * Empty-state explainer shown before any spending limit exists.
 *
 * Walks the signer through the three inputs a spending limit requires:
 * beneficiary, asset & amount, and time period. Purely presentational —
 * it takes no props and renders static instructional copy with icons.
 */
export const Default: Story = {}
