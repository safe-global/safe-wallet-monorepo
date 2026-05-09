import type { Meta, StoryObj } from '@storybook/react'
import { Box, Typography } from '@mui/material'
import { WidgetCard } from './styled'

const meta: Meta<typeof WidgetCard> = {
  title: 'Components/Dashboard/WidgetCard',
  component: WidgetCard,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'Recent Activity',
    children: (
      <Box p={2}>
        <Typography color="text.secondary">Widget content goes here</Typography>
      </Box>
    ),
  },
}

export const WithViewAllLink: Story = {
  args: {
    title: 'Transactions',
    viewAllUrl: '/transactions',
    children: (
      <Box p={2}>
        <Typography>3 pending transactions</Typography>
      </Box>
    ),
  },
}
