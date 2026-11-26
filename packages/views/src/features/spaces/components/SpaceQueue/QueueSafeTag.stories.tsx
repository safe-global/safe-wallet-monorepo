import type { Meta, StoryObj } from '@storybook/react'
import Identicon from '@safe-global/views/components/common/Identicon'
import type { ChainInfo } from '@safe-global/views/features/spaces/types'
import { getPartyTitle, QueuePartyCard } from './QueuePartyCard'
import QueueSafeTag from './QueueSafeTag'

const ETHEREUM: ChainInfo = {
  chainId: '1',
  chainName: 'Ethereum',
  chainLogoUri: 'mock-assets/safe-transaction-assets.safe.global/chains/1/chain_logo.webp',
  shortName: 'eth',
}

const ADDRESS = '0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6'

const card = (name?: string) => (
  <QueuePartyCard
    avatar={<Identicon address={ADDRESS} size={32} />}
    title={getPartyTitle(name, ETHEREUM.chainName)}
    address={ADDRESS}
    copied={false}
    onCopy={() => undefined}
    explorer={{ href: `https://etherscan.io/address/${ADDRESS}`, label: 'Etherscan' }}
    onAddToAddressBook={name ? undefined : () => undefined}
  />
)

function QueuePartyCardWithOpen() {
  return (
    <QueuePartyCard
      avatar={<Identicon address={ADDRESS} size={32} />}
      title={getPartyTitle('Treasury', ETHEREUM.chainName)}
      address={ADDRESS}
      copied={false}
      onCopy={() => undefined}
      explorer={{ href: `https://etherscan.io/address/${ADDRESS}`, label: 'Etherscan' }}
      safeHref={`/home?safe=eth:${ADDRESS}`}
    />
  )
}

const meta = {
  title: 'Features/Spaces/Transactions/QueueSafeTag',
  component: QueueSafeTag,
  parameters: { layout: 'padded' },
  args: { address: ADDRESS, name: 'Treasury', chain: ETHEREUM, card: card('Treasury') },
} satisfies Meta<typeof QueueSafeTag>

export default meta
type Story = StoryObj<typeof meta>

export const Named: Story = {}

/** Links to the Safe's home: a mouse click opens the Safe; hovering, a tap or Enter shows the card */
export const Link: Story = { args: { href: `/home?safe=eth:${ADDRESS}` } }

/** The card of a linked tag, for a tap or Enter: Open Safe takes keyboard and touch users to the Safe */
export const LinkPartyCard: Story = {
  args: {
    href: `/home?safe=eth:${ADDRESS}`,
    card: <QueuePartyCardWithOpen />,
    defaultOpen: true,
  },
  parameters: { layout: 'centered' },
}

/** A long name truncates so the tag keeps its width */
export const LongName: Story = { args: { name: 'Operations multisig for the European payroll' } }

export const ShortAddress: Story = { args: { name: '0xA77D…98b6', card: card() } }

/** The party card: the name on its network, the full address, Copy and the explorer */
export const PartyCard: Story = {
  args: { defaultOpen: true },
  parameters: { layout: 'centered' },
}

/** A Safe the address book doesn't name: the card offers to add it */
export const PartyCardUnnamed: Story = {
  args: { name: '0xA77D…98b6', card: card(), defaultOpen: true },
  parameters: { layout: 'centered' },
}
