import type { Meta, StoryObj } from '@storybook/react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import PeerAddress from '.'

const ADDRESS = '0x7a3F9effb3CBa71e009951eDcA8008bFb52B9C2E'

const meta = {
  title: 'Components/Common/PeerAddress',
  component: PeerAddress,
  parameters: { layout: 'centered' },
  args: { address: ADDRESS },
  decorators: [
    (Story) => (
      <Tooltip open>
        <TooltipTrigger render={<span />}>Look-alike</TooltipTrigger>
        <TooltipContent className="max-w-none">
          <Story />
        </TooltipContent>
      </Tooltip>
    ),
  ],
} satisfies Meta<typeof PeerAddress>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const SharedEnds: Story = {
  args: { prefixLen: 4, suffixLen: 4 },
}

export const WithExplorerLink: Story = {
  args: {
    prefixLen: 4,
    suffixLen: 4,
    explorerLink: { href: `https://etherscan.io/address/${ADDRESS}`, title: 'View on etherscan.io' },
  },
}
