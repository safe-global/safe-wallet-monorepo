import type { Meta, StoryObj } from '@storybook/react'
import { Typography } from '@mui/material'
import SpendingLimitLabel from './index'

const meta = {
  component: SpendingLimitLabel,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SpendingLimitLabel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    label: '100 ETH per day',
  },
}

export const OneTime: Story = {
  args: {
    label: '50 ETH',
    isOneTime: true,
  },
}

export const WithCustomLabel: Story = {
  args: {
    label: (
      <Typography color="primary" fontWeight="bold">
        Custom spending limit
      </Typography>
    ),
  },
}
