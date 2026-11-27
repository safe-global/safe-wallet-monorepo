import type { Meta, StoryObj } from '@storybook/react'
import { ArrowUpRight, GitMerge } from 'lucide-react'
import { ICON_STROKE } from '@safe-global/views/components/common/iconStroke'
import QueueTypeTag from './QueueTypeTag'

const meta = {
  title: 'Features/Spaces/Transactions/QueueTypeTag',
  component: QueueTypeTag,
  parameters: { layout: 'centered' },
  args: {
    title: 'Send',
    hint: 'Transfers tokens out of this Safe.',
    defaultOpen: true,
    children: (
      <>
        <ArrowUpRight className="size-4 text-destructive" strokeWidth={ICON_STROKE} />
        <span className="min-w-0 truncate">Send</span>
      </>
    ),
  },
} satisfies Meta<typeof QueueTypeTag>

export default meta
type Story = StoryObj<typeof meta>

export const Send: Story = {}

/** The nested Safe icon: the transaction signs for another Safe */
export const Nested: Story = {
  args: {
    title: 'Nested',
    hint: 'Approves a transaction on another Safe that this Safe co-owns.',
    children: (
      <>
        <GitMerge className="size-4" strokeWidth={ICON_STROKE} />
        <span className="min-w-0 truncate">Nested</span>
      </>
    ),
  },
}

/** A transaction made in a Safe App shows the app in place of its type */
export const SafeApp: Story = {
  args: {
    title: 'Transaction Builder',
    hint: 'Created in the Transaction Builder Safe App. Calls a function on a smart contract.',
    children: (
      <>
        <span className="flex size-4 items-center justify-center rounded-full bg-background text-[10px]">T</span>
        <span className="min-w-0 truncate">Transaction Builder</span>
      </>
    ),
  },
}
