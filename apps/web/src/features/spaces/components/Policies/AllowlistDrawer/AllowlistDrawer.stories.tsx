import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import { MOCK_ADDRESSES, MOCK_SAFE_NAME, MOCK_SAFES, MOCK_VIEWERS } from '../mocks/policies'
import {
  mockActivatingAllowlist,
  mockAllowlistChangePending,
  mockCgwAllowlist,
  mockCgwUncoveredAllowlist,
  mockCgwUnenforcedAllowlist,
  mockExpiredPendingAllowlist,
  mockExpiredRequestAllowlist,
  mockFailedAllowlist,
  mockReadyToApplyAllowlist,
  mockFullySignedPendingAllowlist,
  mockPendingAllowlist,
  mockPendingAllowlistRemoval,
  mockPendingAllowlistUpdate,
} from '../mocks/allowlistPolicies'
import { createMockStory } from '@/stories/mocks'
import AllowlistDrawer from './AllowlistDrawer'

const PENDING_ARGS = {
  safe: { address: MOCK_SAFES.payroll.address, name: 'Payroll' },
  transactionLink: 'https://app.safe.global/transactions/tx?id=0x4b7e&safe=matic:0x1F25',
  reviewTransactionHref: '/transactions/tx?id=0x4b7e',
}

const SIGNATURES = { threshold: 2, owners: 3 }

// The drawer derives the explorer link from chain config, so the stories need the chains endpoint.
const setup = createMockStory({ layout: 'none' })

const meta = {
  title: 'Features/Spaces/Policies/AllowlistDrawer',
  component: AllowlistDrawer,
  tags: ['autodocs', 'skip-visual-test'],
  parameters: { ...setup.parameters, layout: 'fullscreen' },
  decorators: [setup.decorator],
  args: {
    open: true,
    onClose: fn(),
    safe: { address: MOCK_SAFES.treasury.address, name: MOCK_SAFE_NAME },
    overview: { lastUpdated: 'Oct 12, 2026 · 13:02 UTC', enforcedBy: 'Safe policy contract' },
    names: { [MOCK_ADDRESSES.alice]: 'Alice Contractor', [MOCK_ADDRESSES.bob]: 'Bob Supplier' },
    onEdit: fn(),
    onRemove: fn(),
    onApply: fn(),
    onDiscard: fn(),
    onConnectWallet: fn(),
    policy: mockCgwAllowlist(),
    viewer: MOCK_VIEWERS.signer,
  },
} satisfies Meta<typeof AllowlistDrawer>

export default meta
type Story = StoryObj<typeof meta>

export const ActiveSigner: Story = {}

export const ActiveJustActivated: Story = { args: { justActivated: true } }

export const ActiveSpendingLimitsNotCovered: Story = {
  args: { policy: mockCgwUncoveredAllowlist(), uncoveredSpendingLimitCount: 2 },
}

export const ActiveOneSpendingLimitNotCovered: Story = {
  args: { policy: mockCgwUncoveredAllowlist(), uncoveredSpendingLimitCount: 1 },
}

export const ActiveNoWallet: Story = { args: { viewer: MOCK_VIEWERS.disconnected } }

export const ActiveNotASigner: Story = { args: { viewer: MOCK_VIEWERS.nonSigner } }

export const PendingNotSigned: Story = {
  args: { ...PENDING_ARGS, policy: mockPendingAllowlist(), viewer: MOCK_VIEWERS.signer },
}

export const PendingAlreadySigned: Story = {
  args: { ...PENDING_ARGS, policy: mockPendingAllowlist(), viewer: MOCK_VIEWERS.signerWhoSigned },
}

export const PendingNoWallet: Story = {
  args: { ...PENDING_ARGS, policy: mockPendingAllowlist(), viewer: MOCK_VIEWERS.disconnected },
}

export const PendingNotASigner: Story = {
  args: { ...PENDING_ARGS, policy: mockPendingAllowlist(), viewer: MOCK_VIEWERS.nonSigner },
}

export const PendingFullySigned: Story = {
  args: { ...PENDING_ARGS, policy: mockFullySignedPendingAllowlist(), viewer: MOCK_VIEWERS.nonSigner },
}

export const PendingUpdate: Story = {
  args: { ...PENDING_ARGS, policy: mockPendingAllowlistUpdate(), viewer: MOCK_VIEWERS.signer },
}

export const PendingRemoval: Story = {
  args: { ...PENDING_ARGS, policy: mockPendingAllowlistRemoval(), viewer: MOCK_VIEWERS.signer },
}

export const PendingExecuted: Story = {
  args: { ...PENDING_ARGS, policy: mockPendingAllowlist(), viewer: MOCK_VIEWERS.signer, outcome: 'executed' },
}

export const PendingFailed: Story = {
  args: { ...PENDING_ARGS, policy: mockPendingAllowlist(), viewer: MOCK_VIEWERS.signer, outcome: 'failed' },
}

export const PendingReplaced: Story = {
  args: { ...PENDING_ARGS, policy: mockPendingAllowlist(), viewer: MOCK_VIEWERS.signer, outcome: 'replaced' },
}

export const PendingDeleted: Story = {
  args: { ...PENDING_ARGS, policy: mockPendingAllowlist(), viewer: MOCK_VIEWERS.signer, outcome: 'deleted' },
}

export const PendingExpired: Story = {
  args: { ...PENDING_ARGS, policy: mockExpiredPendingAllowlist(), viewer: MOCK_VIEWERS.signer },
}

/** A first allowlist waits out the guard's delay; its apply button stays disabled until then. */
export const Activating: Story = { args: { policy: mockActivatingAllowlist() } }

export const Unenforced: Story = { args: { policy: mockCgwUnenforcedAllowlist() } }

/** An executed edit waits out the delay before a second transaction can apply it. */
export const ChangePending: Story = { args: { policy: mockAllowlistChangePending() } }

export const FailedSetup: Story = { args: { ...PENDING_ARGS, policy: mockFailedAllowlist() } }

export const UnnamedRecipients: Story = { args: { names: undefined, safe: { address: MOCK_SAFES.treasury.address } } }

/** The delay is over: Review transaction opens the apply flow, the second signing round. */
export const ReadyToApply: Story = { args: { policy: mockReadyToApplyAllowlist(), signatures: SIGNATURES } }

export const ReadyToApplyNotASigner: Story = {
  args: { policy: mockReadyToApplyAllowlist(), signatures: SIGNATURES, viewer: MOCK_VIEWERS.nonSigner },
}

export const ReadyToApplyNoWallet: Story = {
  args: { policy: mockReadyToApplyAllowlist(), signatures: SIGNATURES, viewer: MOCK_VIEWERS.disconnected },
}

export const ReadyToApplyChange: Story = {
  args: { policy: mockReadyToApplyAllowlist('update'), signatures: SIGNATURES },
}

/** The Safe's setup has not loaded, so the banner cannot count the signatures yet. */
export const ReadyToApplySignaturesLoading: Story = { args: { policy: mockReadyToApplyAllowlist() } }

/** Nobody applied the request before its window closed. */
export const ExpiredRequest: Story = { args: { policy: mockExpiredRequestAllowlist() } }

export const ExpiredRequestChange: Story = { args: { policy: mockExpiredRequestAllowlist('update') } }
