import type { Meta, StoryObj } from '@storybook/react'
import { NotActivatedProposer } from './NotActivatedProposer'

const PARENT_SAFE = {
  address: '0x8675B754342754A30A2AeF474D114d8460bca19b',
  name: 'Ops',
  threshold: 3,
}

const OVERVIEW = {
  proposer: { address: '0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326', name: 'Marc' },
  appliesTo: { address: '0x86753FE4b8E29Ce8A38cDf9559D80E05b00cdBA0', name: 'Marketing' },
  initiatedBy: { address: '0xA77De01c5B6f829Cbe4604cF71dDc8C4d608b000', name: 'Jacob' },
  lastUpdated: '06.24.26 03:35 AM UTC',
  enforcedBy: 'Safe module',
}

const meta = {
  title: 'Features/Spaces/Policies/ProposerDrawer/variants/NotActivatedProposer',
  component: NotActivatedProposer,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    safe: PARENT_SAFE,
    signatures: 2,
    overview: OVERVIEW,
  },
  decorators: [
    (Story) => (
      <div className="w-[408px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof NotActivatedProposer>

export default meta
type Story = StoryObj<typeof meta>

/** A signer turned the activation down — the window is still open, so retrying is worth it. */
export const Rejected: Story = {
  args: {
    description:
      'A signer of the parent Safe account, Ops, rejected the transaction. Set the policy up again to retry.',
    expiresLabel: 'Expires in 1h 33 min',
  },
}

/** Nobody rejected it; the signing window simply closed. */
export const Expired: Story = {
  args: {
    description: 'The time window expired. Set the policy up again to retry.',
    expiresLabel: 'Expired',
  },
}
