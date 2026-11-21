import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import { Table, TableBody } from '@safe-global/views/components/ui/table'
import type { ChainInfo } from '@safe-global/views/features/spaces/types'
import QueueGroupRow, { UP_NEXT_GROUP_LABELS } from './QueueGroupRow'

const ETHEREUM: ChainInfo = {
  chainId: '1',
  chainName: 'Ethereum',
  chainLogoUri: 'mock-assets/safe-transaction-assets.safe.global/chains/1/chain_logo.webp',
  shortName: 'eth',
}

const meta = {
  title: 'Features/Spaces/Transactions/QueueGroupRow',
  component: QueueGroupRow,
  parameters: { layout: 'padded' },
  args: { label: UP_NEXT_GROUP_LABELS.next, count: 4, collapsed: false, onToggle: fn() },
  render: (args) => (
    <Table className="table-fixed min-w-[1160px]">
      <TableBody>
        <QueueGroupRow {...args} />
      </TableBody>
    </Table>
  ),
} satisfies Meta<typeof QueueGroupRow>

export default meta
type Story = StoryObj<typeof meta>

export const Group: Story = {}

/** A network band names its chain beside the chain's logo */
export const Network: Story = { args: { label: undefined, chain: ETHEREUM, count: 12 } }

export const Collapsed: Story = { args: { label: UP_NEXT_GROUP_LABELS.behind, count: 7, collapsed: true } }
