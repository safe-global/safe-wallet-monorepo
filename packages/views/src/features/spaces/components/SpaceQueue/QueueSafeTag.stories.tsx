import type { Meta, StoryObj } from '@storybook/react'
import type { ChainInfo } from '@safe-global/views/features/spaces/types'
import QueueSafeTag from './QueueSafeTag'

const ETHEREUM: ChainInfo = {
  chainId: '1',
  chainName: 'Ethereum',
  chainLogoUri: 'mock-assets/safe-transaction-assets.safe.global/chains/1/chain_logo.webp',
  shortName: 'eth',
}

const meta = {
  title: 'Features/Spaces/Transactions/QueueSafeTag',
  component: QueueSafeTag,
  parameters: { layout: 'padded' },
  args: { address: '0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6', name: 'Treasury', chain: ETHEREUM },
} satisfies Meta<typeof QueueSafeTag>

export default meta
type Story = StoryObj<typeof meta>

export const Named: Story = {}

/** A long name truncates so the tag keeps its width */
export const LongName: Story = { args: { name: 'Operations multisig for the European payroll' } }

export const ShortAddress: Story = { args: { name: '0xA77D…98b6' } }
