import type { Meta, StoryObj } from '@storybook/react'
import { withMockProvider } from '@/storybook/preview'
import {
  MOCK_ADDRESSES,
  MOCK_SIGNERS_BY_SAFE,
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
  args: {
    onClose: () => {},
    signers: MOCK_SIGNERS_BY_SAFE['1:0x8675B754342754A30A2AeF474D114d8460bca19b'],
  },
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

/**
 * Connected wallet is a signer: `Delete` and `Edit` are enabled and there is nothing to explain.
 * The story renders whatever wallet the mock provider supplies — see the unit tests for the
 * per-state assertions.
 */
export const ActiveNotASigner: Story = {
  args: { policy: asActivePolicy(mockSpendingLimitPolicy()), signers: [MOCK_ADDRESSES.unresolved] },
}

/** Nobody can revoke this grant: the owner who granted it is no longer an owner (WA-1026). */
export const OrphanedProposerGrant: Story = {
  args: { policy: asActivePolicy(mockProposerPolicy()), signers: [MOCK_ADDRESSES.bob] },
}

/** A limit with nothing left reads differently from an untouched one. */
export const ExhaustedLimit: Story = {
  args: { policy: asActivePolicy(mockMultiSpenderPolicy()) },
}
