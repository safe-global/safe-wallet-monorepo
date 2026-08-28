import type { Meta, StoryObj } from '@storybook/react'
import { withMockProvider } from '@/storybook/preview'
import {
  MOCK_ADDRESSES,
  asActivePolicy,
  mockMultiSpenderPolicy,
  mockPendingPolicy,
  mockProposerPolicy,
  mockRecoveryPolicy,
  mockSpendingLimitPolicy,
  mockUnenforcedPolicy,
} from '../mocks/policies'
import PolicyDetailPanel from './index'

const meta = {
  title: 'Features/Spaces/Policies/PolicyDetailPanel',
  component: PolicyDetailPanel,
  decorators: [withMockProvider()],
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { onClose: () => {} },
} satisfies Meta<typeof PolicyDetailPanel>

export default meta
type Story = StoryObj<typeof meta>

export const SpendingLimit: Story = {
  args: { policy: asActivePolicy(mockSpendingLimitPolicy()) },
}

/** The spender block repeats — one policy holding three spenders is still one policy. */
export const MultiSpender: Story = {
  args: { policy: asActivePolicy(mockMultiSpenderPolicy()) },
}

/** Off-chain access: no module to link, so `Enforced by` says so instead. */
export const ProposerGrant: Story = {
  args: { policy: asActivePolicy(mockProposerPolicy()) },
}

export const Recovery: Story = {
  args: { policy: asActivePolicy(mockRecoveryPolicy()) },
}

/** Module present but not enabled on the Safe. */
export const Unenforced: Story = {
  args: { policy: asActivePolicy(mockUnenforcedPolicy()) },
}

export const Pending: Story = {
  args: { policy: mockPendingPolicy() },
}

/** No address-book entry: the address renders truncated and copyable, never as a blank cell. */
export const UnresolvedAddress: Story = {
  args: {
    policy: asActivePolicy(mockSpendingLimitPolicy({ createdBy: MOCK_ADDRESSES.unresolved })),
  },
}

/** Enough spenders to overflow — the card scrolls independently of the page. */
export const Overflowing: Story = {
  args: {
    policy: asActivePolicy(
      mockSpendingLimitPolicy({
        data: {
          spenders: Array.from({ length: 8 }, (_, index) => ({
            spender: `0x${String(index).padStart(40, '0')}`,
            allowances: mockMultiSpenderPolicy().data.spenders[0].allowances,
          })),
        },
      }),
    ),
  },
}
