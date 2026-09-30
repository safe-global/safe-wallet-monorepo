import type { Meta, StoryObj } from '@storybook/react'
import { UserRoundPen, Wallet } from 'lucide-react'
import PolicyDrawerHeader from './PolicyDrawerHeader'

const meta = {
  title: 'Features/Spaces/Policies/components/PolicyDrawerHeader',
  component: PolicyDrawerHeader,
  parameters: { layout: 'centered' },
  decorators: [(Story) => <div className="w-[400px]">{Story()}</div>],
  args: { icon: Wallet, title: 'Spending limit', status: 'active' },
} satisfies Meta<typeof PolicyDrawerHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Active: Story = {}

/** A module that is configured but not enabled enforces nothing. */
export const Unenforced: Story = { args: { status: 'unenforced' } }

/** A proposer grant that never took effect: nothing enforces it either way. */
export const NotActivated: Story = { args: { icon: UserRoundPen, title: 'Proposer role', status: 'not-activated' } }

/** The status is still being read, so the slot holds its place. */
export const StatusLoading: Story = { args: { icon: UserRoundPen, title: 'Proposer role', status: undefined } }
