import type { Meta, StoryObj } from '@storybook/react'
import ProposerOverview, { ProposerOverviewSkeleton } from './ProposerOverview'

const meta = {
  title: 'Features/Spaces/Policies/ProposerDrawer/components/ProposerOverview',
  component: ProposerOverview,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    proposer: { address: '0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326', name: 'Marc' },
    appliesTo: { address: '0x86753FE4b8E29Ce8A38cDf9559D80E05b00cdBA0', name: 'Treasury' },
    initiatedBy: { address: '0xA77De01c5B6f829Cbe4604cF71dDc8C4d608b000', name: 'Jacob' },
    lastUpdated: '06.24.26 03:35 AM UTC',
    enforcedBy: 'Safe module',
  },
  decorators: [
    (Story) => (
      <div className="w-[408px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProposerOverview>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** No address book entries — every row falls back to the shortened address. */
export const UnnamedAccounts: Story = {
  args: {
    proposer: { address: '0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326' },
    appliesTo: { address: '0x86753FE4b8E29Ce8A38cDf9559D80E05b00cdBA0' },
    initiatedBy: { address: '0xA77De01c5B6f829Cbe4604cF71dDc8C4d608b000' },
  },
}

/** Names longer than the content column — they truncate instead of pushing the address out. */
export const LongNames: Story = {
  args: {
    proposer: { address: '0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326', name: 'Marketing operations treasury proposer' },
    appliesTo: { address: '0x86753FE4b8E29Ce8A38cDf9559D80E05b00cdBA0', name: 'Marketing operations treasury' },
    initiatedBy: {
      address: '0xA77De01c5B6f829Cbe4604cF71dDc8C4d608b000',
      name: 'Jacob from the marketing operations team',
    },
  },
}

/** The policy is still being fetched — the rows keep their heights so nothing jumps on arrival. */
export const Loading: Story = {
  render: () => <ProposerOverviewSkeleton />,
}
