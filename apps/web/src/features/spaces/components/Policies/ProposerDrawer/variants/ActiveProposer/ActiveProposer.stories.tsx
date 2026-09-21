import type { Meta, StoryObj } from '@storybook/react'
import { ActiveProposer } from './ActiveProposer'

const meta = {
  title: 'Features/Spaces/Policies/ProposerDrawer/variants/ActiveProposer',
  component: ActiveProposer,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    overview: {
      proposer: { address: '0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326', name: 'Treasury' },
      appliesTo: { address: '0x86753FE4b8E29Ce8A38cDf9559D80E05b00cdBA0', name: 'Treasury' },
      initiatedBy: { address: '0xA77De01c5B6f829Cbe4604cF71dDc8C4d608b000', name: 'Treasury' },
      lastUpdated: '06.24.26 03:35 AM UTC',
      enforcedBy: 'Safe module',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[408px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ActiveProposer>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
