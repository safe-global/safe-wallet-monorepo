import type { Meta, StoryObj } from '@storybook/react'
import { Paper } from '@mui/material'
import { NoSpendingLimits } from './NoSpendingLimits'

const meta: Meta<typeof NoSpendingLimits> = {
  title: 'Components/Settings/SpendingLimits/NoSpendingLimits',
  component: NoSpendingLimits,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <Paper sx={{ p: 4, maxWidth: 600 }}>
        <Story />
      </Paper>
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
