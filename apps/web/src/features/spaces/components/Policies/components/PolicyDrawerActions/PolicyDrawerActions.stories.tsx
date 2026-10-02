import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import PolicyDrawerActions, { PolicyDrawerActionsSkeleton } from './PolicyDrawerActions'

const meta = {
  title: 'Features/Spaces/Policies/components/PolicyDrawerActions',
  component: PolicyDrawerActions,
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
} satisfies Meta<typeof PolicyDrawerActions>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Pending: Story = {
  args: {
    actionLabel: 'Review transaction',
  },
}

/** A live proposer role: removing it is a secondary, destructive-adjacent action. */
export const Secondary: Story = {
  args: {
    actionLabel: 'Remove proposer',
    variant: 'secondary',
  },
}

export const WithHint: Story = {
  args: {
    actionLabel: 'Connect wallet',
    hint: 'Connect a signer wallet of Treasury to edit.',
  },
}

export const DisabledWithHint: Story = {
  args: {
    actionLabel: 'Remove proposer',
    variant: 'secondary',
    disabled: true,
    hint: 'Only signers of this Treasury can delete or edit this Proposer role.',
  },
}

/** What the action offers is not known until the policy loads. */
export const Loading: Story = {
  render: () => <PolicyDrawerActionsSkeleton />,
}
