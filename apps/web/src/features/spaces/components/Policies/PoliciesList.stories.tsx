import type { Meta, StoryObj } from '@storybook/react'
import { withMockProvider } from '@/storybook/decorators'
import {
  asActivePolicy,
  mockActiveSpendingLimit,
  mockLongPolicyList,
  mockMultiSpenderPolicy,
  mockPendingPolicy,
  mockPendingRemoval,
  mockPendingUpdate,
  mockPolicies,
  mockProposerPolicy,
  mockRecoveryPolicy,
  mockUnenforcedPolicy,
} from '../../public/utils/policies'
import {
  mockActivatingAllowlist,
  mockActiveAllowlist,
  mockAllowlistAwaitingGuardRemoval,
  mockAllowlistChangePending,
  mockAllowlistRemovalScheduled,
  mockCgwAllowlist,
  mockCgwUnenforcedAllowlist,
  mockExpiredRequestAllowlist,
  mockFailedAllowlist,
  mockFullySignedPendingAllowlist,
  mockPendingAllowlist,
  mockReadyToApplyAllowlist,
} from '../../public/utils/allowlistPolicies'
import PoliciesList from './PoliciesList'

const meta = {
  title: 'Features/Spaces/Policies/PoliciesList',
  component: PoliciesList,
  decorators: [withMockProvider()],
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof PoliciesList>

export default meta
type Story = StoryObj<typeof meta>

/** Every policy type at once: spending limit, pending, recovery, proposer and unenforced. */
export const Populated: Story = {
  args: { policies: mockPolicies() },
}

/** One policy per Safe holding three spenders — one row, not three. */
export const MultiSpender: Story = {
  args: { policies: [asActivePolicy(mockMultiSpenderPolicy())] },
}

/** Module configured but disabled on the Safe: neither hidden nor shown as active. */
export const Unenforced: Story = {
  args: { policies: [asActivePolicy(mockUnenforcedPolicy())] },
}

export const PendingSpendingLimit: Story = {
  args: { policies: [mockPendingPolicy()] },
}

/** An active limit alongside a queued edit and removal of it, plus an unrelated queued creation. */
export const WithQueuedChanges: Story = {
  args: {
    policies: [mockActiveSpendingLimit(), mockPendingUpdate(), mockPendingRemoval(), mockPendingPolicy()],
  },
}

/** Off-chain access, not an on-chain policy — so no token icons and no module. */
export const ProposerGrant: Story = {
  args: { policies: [asActivePolicy(mockProposerPolicy())] },
}

export const Recovery: Story = {
  args: { policies: [asActivePolicy(mockRecoveryPolicy())] },
}

export const ActiveAllowlist: Story = {
  args: { policies: [mockCgwAllowlist()] },
}

export const UnenforcedAllowlist: Story = {
  args: { policies: [mockCgwUnenforcedAllowlist()] },
}

export const PendingAllowlist: Story = {
  args: { policies: [mockPendingAllowlist()] },
}

export const AllowlistReadyToExecute: Story = {
  args: { policies: [mockFullySignedPendingAllowlist()] },
}

export const AllowlistActivating: Story = {
  args: { policies: [mockActivatingAllowlist()] },
}

/** The executed edit waits out the delay on the allowlist's own row. */
export const AllowlistChangePending: Story = {
  args: { policies: [mockAllowlistChangePending()] },
}

/** One allowlist in each state that has a status, sorted with the ones that need the user first. */
export const AllowlistStatuses: Story = {
  args: {
    policies: [
      mockActiveAllowlist(),
      mockPendingAllowlist({ id: 'setup-pending', appliesOnExecution: true }),
      mockPendingAllowlist({ id: 'setup-ready', appliesOnExecution: true, confirmationsSubmitted: 2 }),
      mockPendingAllowlist({ id: 'edit-pending', operation: 'update', step: 'request' }),
      mockAllowlistChangePending(),
      mockReadyToApplyAllowlist('update'),
      mockPendingAllowlist({ id: 'edit-apply-pending', operation: 'update', step: 'apply' }),
      mockExpiredRequestAllowlist('update'),
      mockAllowlistRemovalScheduled(),
      mockAllowlistAwaitingGuardRemoval(),
      mockPendingAllowlist({
        id: 'guard-removal-ready',
        operation: 'remove',
        step: 'remove-guard',
        confirmationsSubmitted: 2,
      }),
      { ...mockPendingAllowlist({ id: 'processing', operation: 'update', step: 'apply' }), status: 'activating' },
    ],
  },
}

export const AllowlistFailed: Story = {
  args: { policies: [mockFailedAllowlist()] },
}

export const WithAllowlists: Story = {
  args: {
    policies: [
      ...mockPolicies(),
      mockCgwAllowlist(),
      mockPendingAllowlist(),
      mockFullySignedPendingAllowlist(),
      mockActivatingAllowlist(),
      mockAllowlistChangePending(),
      mockFailedAllowlist(),
    ],
  },
}

/** Exercises pagination and the sort control. */
export const LongList: Story = {
  args: { policies: mockLongPolicyList(30) },
}

/**
 * The table's only empty state. An empty policy list never reaches this component: the page shows
 * the catalogue instead. So the table is empty only when a search matches nothing.
 */
export const NoSearchResults: Story = {
  args: { policies: mockPolicies() },
  play: async ({ canvasElement }) => {
    const { userEvent, within } = await import('storybook/test')
    const search = within(canvasElement).getByPlaceholderText('Search')
    await userEvent.type(search, 'zzzz')
  },
}
