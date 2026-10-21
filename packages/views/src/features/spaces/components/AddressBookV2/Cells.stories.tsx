import type { ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import Identicon from '@/components/common/Identicon'
import ChainLogos from './ChainLogos'
import ContactCell from './ContactCell'
import GroupedAddress from './GroupedAddress'
import { ADDRESSES, ALL_CHAINS, CHAINS } from './mocks/fixtures'

/** The building blocks of a row. */
const meta = {
  title: 'Features/Spaces/AddressBookV2/Cells',
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="border-border grid grid-cols-[12rem_1fr] items-center gap-4 border-b py-3 last:border-b-0">
    <span className="text-muted-foreground text-sm">{label}</span>
    <div className="min-w-0">{children}</div>
  </div>
)

/** Name, full grouped address and copy. Never shortened. */
export const Contact: Story = {
  render: () => (
    <div className="max-w-xl">
      <Row label="Identicon">
        <ContactCell
          name="Treasury"
          address={ADDRESSES.treasury}
          avatar={<Identicon address={ADDRESSES.treasury} size={24} />}
        />
      </Row>
      <Row label="Default avatar">
        <ContactCell name="Treasury" address={ADDRESSES.treasury} />
      </Row>
      <Row label="Local contact">
        <ContactCell name="My hardware wallet" address={ADDRESSES.hardwareWallet} isLocal />
      </Row>
      <Row label="Long name">
        <div className="w-80">
          <ContactCell
            name="Lighthouse Ventures Fund II strategic multisig (Series A lead)"
            address={ADDRESSES.lighthouse}
          />
        </div>
      </Row>
    </div>
  ),
}

/** Look-alikes share the first and last group; the grouping makes the middle easy to compare. */
export const Address: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <GroupedAddress address={ADDRESSES.treasury} />
      <GroupedAddress address={ADDRESSES.treasuryLookAlike} />
    </div>
  ),
}

export const Chains: Story = {
  render: () => (
    <div className="max-w-md">
      <Row label="One">
        <ChainLogos chains={[CHAINS.ethereum]} />
      </Row>
      <Row label="Three">
        <ChainLogos chains={[CHAINS.ethereum, CHAINS.arbitrum, CHAINS.optimism]} />
      </Row>
      <Row label="Six (+3)">
        <ChainLogos chains={ALL_CHAINS} />
      </Row>
      <Row label="No logo">
        <ChainLogos chains={[{ chainId: '999', chainName: 'Hyperliquid', chainLogoUri: null, shortName: 'hl' }]} />
      </Row>
    </div>
  ),
}
