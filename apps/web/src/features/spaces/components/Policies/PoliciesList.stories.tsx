import type { Meta, StoryObj } from '@storybook/react'
import { withMockProvider } from '@/storybook/preview'
import {
  asActivePolicy,
  mockLongPolicyList,
  mockMultiSpenderPolicy,
  mockPendingPolicy,
  mockPolicies,
  mockProposerPolicy,
  mockRecoveryPolicy,
  mockUnenforcedPolicy,
} from './mocks/policies'
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

export const Loading: Story = {
  args: { policies: [], isLoading: true },
}

/** The read path is atomic, so a failure shows an error rather than a partial list. */
export const Error: Story = {
  args: { policies: [], isError: true, onRetry: () => {} },
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

/** Off-chain access, not an on-chain policy — so no token icons and no module. */
export const ProposerGrant: Story = {
  args: { policies: [asActivePolicy(mockProposerPolicy())] },
}

export const Recovery: Story = {
  args: { policies: [asActivePolicy(mockRecoveryPolicy())] },
}

/** Exercises pagination and the sort control. */
export const LongList: Story = {
  args: { policies: mockLongPolicyList(30) },
}
