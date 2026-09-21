import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import PolicyActions from './PolicyActions'

const meta = {
  title: 'Features/Spaces/Policies/PolicyDrawer/PolicyActions',
  component: PolicyActions,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    actionLabel: 'Submit delegation',
    onClick: fn(),
  },
  decorators: [
    (Story) => (
      <div className="w-[408px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PolicyActions>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Pending: Story = {
  args: {
    actionLabel: 'Review transaction',
  },
}
