import type { Meta, StoryObj } from '@storybook/react'
import { UserRoundPen, Wallet } from 'lucide-react'
import { Badge, BadgeDot } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import PolicyDrawerHeader from './PolicyDrawerHeader'

const meta = {
  title: 'Features/Spaces/Policies/components/PolicyDrawerHeader',
  component: PolicyDrawerHeader,
  parameters: { layout: 'centered' },
  decorators: [(Story) => <div className="w-[400px]">{Story()}</div>],
  args: { icon: Wallet, title: 'Spending limit' },
} satisfies Meta<typeof PolicyDrawerHeader>

export default meta
type Story = StoryObj<typeof meta>

export const WithStatus: Story = {
  args: {
    children: (
      <Badge variant="success" size="status" shape="status">
        <BadgeDot />
        Active
      </Badge>
    ),
  },
}

/** A policy whose status is still loading keeps the slot, so the header does not jump. */
export const StatusLoading: Story = {
  args: { icon: UserRoundPen, title: 'Proposer role', children: <Skeleton className="h-6 w-24 rounded-lg" /> },
}

/** Nothing to say about the status yet: the slot collapses rather than leaving a gap. */
export const WithoutStatus: Story = {}
