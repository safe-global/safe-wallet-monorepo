import type { Meta, StoryObj } from '@storybook/react'
import { withMockProvider } from '@/storybook/preview'
import { ThresholdBadge, PendingBadge } from '.'

const meta = {
  title: 'Common/AccountBadges',
  component: ThresholdBadge,
  decorators: [withMockProvider({ shadcn: true })],
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof ThresholdBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Threshold: Story = {
  args: { threshold: 3, owners: 5 },
}

export const ThresholdIconOnly: Story = {
  args: { iconOnly: true },
}

export const ThresholdLoading: Story = {
  args: { loading: true },
}

export const Pending: Story = {
  render: () => <PendingBadge count={4} />,
}

export const PendingCompact: Story = {
  render: () => <PendingBadge count={4} compact />,
}
