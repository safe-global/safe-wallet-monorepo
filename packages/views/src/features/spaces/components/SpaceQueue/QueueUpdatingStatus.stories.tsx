import type { Meta, StoryObj } from '@storybook/react'
import QueueUpdatingStatus from './QueueUpdatingStatus'

const meta = {
  title: 'Features/Spaces/Transactions/QueueUpdatingStatus',
  component: QueueUpdatingStatus,
  parameters: { layout: 'padded' },
  args: { isStale: true },
  decorators: [
    (Story) => (
      <div className="relative mt-6 h-10 rounded-lg border border-border">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof QueueUpdatingStatus>

export default meta
type Story = StoryObj<typeof meta>

/** Above the dimmed queue while a new search or filter loads */
export const Updating: Story = {}

/** Empty once the new queue arrives */
export const Idle: Story = { args: { isStale: false } }
