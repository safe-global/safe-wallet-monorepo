import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import Identicon from '@/components/common/Identicon'
import CategoryCell from './CategoryCell'
import ChainLogos from './ChainLogos'
import ContactCell from './ContactCell'
import GroupedAddress from './GroupedAddress'
import { ADDRESSES, ALL_CHAINS, CHAINS } from './mocks/fixtures'

/** The building blocks of a row. */
const meta = {
  title: 'Features/Spaces/AddressBook/Cells',
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="border-border grid grid-cols-[12rem_1fr] items-center gap-4 border-b py-3 last:border-b-0">
    <span className="text-muted-foreground text-sm">{label}</span>
    <div className="min-w-0">{children}</div>
  </div>
)

/** Category chip, with "Signer of …" underneath for signers. A long list truncates; hover for all. */
export const Category: Story = {
  render: () => (
    <div className="max-w-xl">
      <Row label="Workspace Safe">
        <CategoryCell category="workspace-safe" />
      </Row>
      <Row label="Safe account">
        <CategoryCell category="safe" />
      </Row>
      <Row label="Safe account, signer">
        <CategoryCell category="safe" signerOf={['Treasury']} />
      </Row>
      <Row label="Contract">
        <CategoryCell category="contract" />
      </Row>
      <Row label="EOA">
        <CategoryCell category="eoa" />
      </Row>
      <Row label="EOA, signer of four">
        <div className="w-40">
          <CategoryCell category="eoa" signerOf={['Ops multisig', 'Grants program', 'Treasury', 'Payroll']} />
        </div>
      </Row>
      <Row label="Not sure (hover: Check again)">
        <CategoryCell category="unknown" onRetry={fn()} />
      </Row>
      <Row label="Resolving">
        <CategoryCell category="loading" />
      </Row>
    </div>
  ),
}

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
        <ContactCell name="My hardware wallet" address={ADDRESSES.maya} isLocal />
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
        <ChainLogos chains={[{ chainId: '999', name: 'Hyperliquid' }]} />
      </Row>
    </div>
  ),
}
