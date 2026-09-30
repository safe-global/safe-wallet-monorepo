import type { Meta, StoryObj } from '@storybook/react'
import { Typography } from '@/components/ui/typography'
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
      <div className="p-4">
        <Typography color="muted">Widget content goes here</Typography>
      </div>
    ),
  },
}

export const WithViewAllLink: Story = {
  args: {
    title: 'Transactions',
    viewAllUrl: '/transactions',
    children: (
      <div className="p-4">
        <Typography>3 pending transactions</Typography>
      </div>
    ),
  },
}
