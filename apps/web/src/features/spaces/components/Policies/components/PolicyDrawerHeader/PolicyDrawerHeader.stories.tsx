import type { Meta, StoryObj } from '@storybook/react'
import { UserRoundPen, Users, Wallet } from 'lucide-react'
import {
  ALLOWLIST_STATUS,
  formatAllowlistStatus,
} from '@safe-global/views/features/spaces/components/Policies/allowlistStatus'
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

/** An allowlist shows the change it is in beside the status of that change. */
export const AllowlistChange: Story = {
  args: {
    icon: Users,
    title: 'Allowlist',
    status: {
      state: 'guard-removal-ready-to-execute',
      change: 'guard-removal',
      label: formatAllowlistStatus('guard-removal-ready-to-execute'),
      variant: ALLOWLIST_STATUS['guard-removal-ready-to-execute'].variant,
    },
  },
}
