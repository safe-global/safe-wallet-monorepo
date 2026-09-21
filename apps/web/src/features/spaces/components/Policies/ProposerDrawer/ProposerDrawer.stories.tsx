import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import ProposerDrawer from './ProposerDrawer'
import { ProposerStatus } from './variants/types'

const PARENT_SAFE = {
  address: '0x8675B754342754A30A2AeF474D114d8460bca19b',
  name: 'Ops',
  threshold: 3,
}

const OVERVIEW = {
  proposer: { address: '0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326', name: 'Treasury' },
  appliesTo: { address: '0x86753FE4b8E29Ce8A38cDf9559D80E05b00cdBA0', name: 'Treasury' },
  initiatedBy: { address: '0xA77De01c5B6f829Cbe4604cF71dDc8C4d608b000', name: 'Treasury' },
  lastUpdated: '06.24.26 03:35 AM UTC',
  enforcedBy: 'Safe module',
}

const meta = {
  title: 'Features/Spaces/Policies/ProposerDrawer',
  component: ProposerDrawer,
  tags: ['autodocs', 'skip-visual-test'],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    open: true,
    onClose: fn(),
    onAction: fn(),
  },
} satisfies Meta<typeof ProposerDrawer>

export default meta
type Story = StoryObj<typeof meta>

/** A live proposer role, seen by a signer who can remove it. */
export const ActiveProposer: Story = {
  args: {
    status: ProposerStatus.ACTIVE,
    overview: OVERVIEW,
    actionLabel: 'Remove proposer',
    actionVariant: 'secondary',
  },
}

/** Same proposer role with no wallet connected — editing needs a signer wallet first. */
export const WalletNotConnected: Story = {
  args: {
    status: ProposerStatus.ACTIVE,
    overview: OVERVIEW,
    actionLabel: 'Connect wallet',
    actionHint: 'Connect a signer wallet of Treasury to edit.',
  },
}

/** Connected, but the wallet does not sign for this Safe — the action stays out of reach. */
export const NotASigner: Story = {
  args: {
    status: ProposerStatus.ACTIVE,
    overview: OVERVIEW,
    actionLabel: 'Remove proposer',
    actionVariant: 'secondary',
    actionDisabled: true,
    actionHint: 'Only signers of this Treasury can delete or edit this Proposer role.',
  },
}

export const Pending: Story = {
  args: {
    status: ProposerStatus.PENDING,
    actionLabel: 'Review transaction',
    description:
      'Marketing is a nested Safe account. The parent Safe account, Ops, needs to execute the transaction before the proposer role activates.',
    safe: PARENT_SAFE,
    signatures: 2,
    expiresLabel: 'Expires in 1h 33 min',
    overview: OVERVIEW,
  },
}

/** A signer turned the activation down — the window is still open, so retrying is worth it. */
export const Rejected: Story = {
  args: {
    status: ProposerStatus.NOT_ACTIVATED,
    actionLabel: 'Retry',
    description:
      'A signer of the parent Safe account, Ops, rejected the transaction. Set the policy up again to retry.',
    safe: PARENT_SAFE,
    signatures: 2,
    expiresLabel: 'Expires in 1h 33 min',
    overview: OVERVIEW,
  },
}

/** Nobody rejected it; the signing window simply closed. */
export const Expired: Story = {
  args: {
    status: ProposerStatus.NOT_ACTIVATED,
    actionLabel: 'Retry',
    description: 'The time window expired. Set the policy up again to retry.',
    safe: PARENT_SAFE,
    signatures: 2,
    expiresLabel: 'Expired',
    overview: OVERVIEW,
  },
}
