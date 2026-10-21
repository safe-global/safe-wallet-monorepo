import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import { MOCK_ADDRESSES, MOCK_SAFE_NAME, MOCK_SAFES, MOCK_VIEWERS } from '../mocks/policies'
import { mockActiveAllowlist, mockFullySignedPendingAllowlist, mockPendingAllowlist } from '../mocks/allowlistPolicies'
import { createMockStory } from '@/stories/mocks'
import AllowlistDrawer from './AllowlistDrawer'

const PENDING_ARGS = {
  safe: { address: MOCK_SAFES.payroll.address, name: 'Payroll' },
  transactionLink: 'https://app.safe.global/transactions/tx?id=0x4b7e&safe=matic:0x1F25',
  reviewTransactionHref: '/transactions/tx?id=0x4b7e',
}

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
    onConnectWallet: fn(),
    policy: mockActiveAllowlist(),
    viewer: MOCK_VIEWERS.signer,
  },
} satisfies Meta<typeof AllowlistDrawer>

export default meta
type Story = StoryObj<typeof meta>

/** A live allowlist seen by a signer, who can edit or remove it. */
export const ActiveSigner: Story = {}

/** No wallet connected; editing needs a signer wallet first. */
export const ActiveNoWallet: Story = { args: { viewer: MOCK_VIEWERS.disconnected } }

/** Connected, but this wallet does not sign for the Safe. */
export const ActiveNotASigner: Story = { args: { viewer: MOCK_VIEWERS.nonSigner } }

/** Awaiting signatures, this signer's among them. */
export const PendingNotSigned: Story = {
  args: { ...PENDING_ARGS, policy: mockPendingAllowlist(), viewer: MOCK_VIEWERS.signer },
}

/** Awaiting signatures; this signer has signed and waits for the others. */
export const PendingAlreadySigned: Story = {
  args: { ...PENDING_ARGS, policy: mockPendingAllowlist(), viewer: MOCK_VIEWERS.signerWhoSigned },
}

/** Awaiting signatures, no wallet connected. */
export const PendingNoWallet: Story = {
  args: { ...PENDING_ARGS, policy: mockPendingAllowlist(), viewer: MOCK_VIEWERS.disconnected },
}

/** Awaiting signatures, seen by a wallet that does not sign for the Safe. */
export const PendingNotASigner: Story = {
  args: { ...PENDING_ARGS, policy: mockPendingAllowlist(), viewer: MOCK_VIEWERS.nonSigner },
}

/** Awaiting execution: every signature is in, so anyone can execute it. */
export const PendingFullySigned: Story = {
  args: { ...PENDING_ARGS, policy: mockFullySignedPendingAllowlist(), viewer: MOCK_VIEWERS.nonSigner },
}

/** Nothing in the address book: every recipient reads as its shortened address. */
export const UnnamedRecipients: Story = { args: { names: undefined, safe: { address: MOCK_SAFES.treasury.address } } }
