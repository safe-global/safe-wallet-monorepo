import type { Meta, StoryObj } from '@storybook/react'
import { PendingProposer } from './PendingProposer'

const PARENT_SAFE = {
  address: '0x8675B754342754A30A2AeF474D114d8460bca19b',
  name: 'Ops',
  threshold: 3,
}

const meta = {
  title: 'Features/Spaces/Policies/ProposerDrawer/variants/PendingProposer',
  component: PendingProposer,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    description:
      'Marketing is a nested Safe account. The parent Safe account, Ops, needs to execute the transaction before the proposer role activates.',
    safe: PARENT_SAFE,
    signatures: 2,
    expiresLabel: 'Expires in 1h 33 min',
    overview: {
      proposer: { address: '0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326', name: 'Marc' },
      appliesTo: { address: '0x86753FE4b8E29Ce8A38cDf9559D80E05b00cdBA0', name: 'Marketing' },
      initiatedBy: { address: '0xA77De01c5B6f829Cbe4604cF71dDc8C4d608b000', name: 'Jacob' },
      lastUpdated: '06.24.26 03:35 AM UTC',
      enforcedBy: 'Safe module',
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-[440px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PendingProposer>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** The viewer cannot sign — the parent Safe's signers still have to reach the threshold. */
export const NotASigner: Story = {
  args: {
    description:
      'Marketing is a nested Safe account. The parent Safe account, Ops, needs to reach its signing threshold before the proposer role activates.',
  },
}

/** The viewer signs with a parent Safe wallet — the threshold is met, execution is left. */
export const ParentSafeSigner: Story = {
  args: {
    description:
      'Marketing is a nested Safe account. The parent Safe account, Ops, needs to execute the transaction before the proposer role activates.',
  },
}

export const NoSignaturesYet: Story = {
  args: {
    signatures: 0,
  },
}

/** Threshold reached — the delegation still has to be submitted before the role activates. */
export const AllSignaturesCollected: Story = {
  args: {
    description: 'Submit the delegation to activate.',
    signatures: PARENT_SAFE.threshold,
  },
}
