import type { ComponentProps } from 'react'
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

const LONG_NAME = 'Operations multisig for the European payroll and contractor payouts'

type StoryArgs = ComponentProps<typeof ScopedSafeTag> & { title: string; cardWidth: number }

/** The tag in the title row of a transaction flow, above a card of the given width */
const meta = {
  title: 'Components/TxFlow/ScopedSafeTag',
  parameters: { layout: 'padded' },
  args: {
    address: '0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6',
    name: 'Treasury',
    chain: ETHEREUM,
    title: 'Confirm transaction',
    cardWidth: 672,
  },
  render: ({ title, cardWidth, ...tag }) => (
    <div className="bg-secondary p-4" style={{ width: cardWidth + 32 }}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <Typography variant="h3" className="font-bold">
          {title}
        </Typography>
        <ScopedSafeTag {...tag} />
      </div>
      <div className="h-16 rounded-xl bg-card" />
    </div>
  ),
} satisfies Meta<StoryArgs>

export default meta
type Story = StoryObj<typeof meta>

export const Named: Story = {}

export const Unnamed: Story = { args: { name: undefined } }

/** A long name truncates so the tag stays on the title's line */
export const LongName: Story = { args: { name: LONG_NAME } }

/** The card at a 900px viewport: the network name gives way first */
export const NarrowCard: Story = { args: { cardWidth: 448 } }

/** The address of a named Safe goes next, so the name keeps its room */
export const NarrowCardLongName: Story = { args: { cardWidth: 448, name: LONG_NAME } }

export const NarrowCardUnnamed: Story = { args: { cardWidth: 448, name: undefined } }

/** No room beside the title: the tag moves to its own line */
export const Mobile: Story = { args: { cardWidth: 343 } }

export const MobileLongName: Story = { args: { cardWidth: 343, name: LONG_NAME } }

export const LongTitle: Story = { args: { title: 'Confirm spending limit policy update', name: LONG_NAME } }
