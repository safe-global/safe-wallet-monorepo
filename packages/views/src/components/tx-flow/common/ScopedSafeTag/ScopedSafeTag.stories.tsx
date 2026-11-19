import type { Meta, StoryObj } from '@storybook/react'
import { Typography } from '@safe-global/views/components/ui/typography'
import type { ChainInfo } from '@safe-global/views/features/spaces/types'
import ScopedSafeTag from './index'

const ETHEREUM: ChainInfo = {
  chainId: '1',
  chainName: 'Ethereum',
  chainLogoUri: 'mock-assets/safe-transaction-assets.safe.global/chains/1/chain_logo.webp',
  shortName: 'eth',
}

const meta = {
  title: 'Components/TxFlow/ScopedSafeTag',
  component: ScopedSafeTag,
  parameters: { layout: 'padded' },
  args: { address: '0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6', name: 'Treasury', chain: ETHEREUM },
  decorators: [
    (Story) => (
      <div className="flex max-w-[672px] items-center justify-between gap-4 bg-secondary p-4">
        <Typography variant="h3" className="shrink-0 font-bold">
          Confirm transaction
        </Typography>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ScopedSafeTag>

export default meta
type Story = StoryObj<typeof meta>

export const Named: Story = {}

export const Unnamed: Story = { args: { name: undefined } }

/** A long name truncates so the tag stays on the title's line */
export const LongName: Story = {
  args: { name: 'Operations multisig for the European payroll and contractor payouts' },
}
