import type { Meta, StoryObj } from '@storybook/react'
import { Table, TableBody } from '@safe-global/views/components/ui/table'
import { QueueGroupRow } from './QueueGroupRow'

const meta = {
  title: 'Features/Spaces/Transactions/QueueGroupRow',
  component: QueueGroupRow,
  parameters: { layout: 'padded' },
  args: { label: 'Next in line', count: 4, collapsed: false, colSpan: 6, onToggle: () => {} },
  render: (args) => (
    <Table variant="panel">
      <TableBody>
        <QueueGroupRow {...args} />
      </TableBody>
    </Table>
  ),
} satisfies Meta<typeof QueueGroupRow>

export default meta
type Story = StoryObj<typeof meta>

export const Group: Story = {}

export const Network: Story = {
  args: {
    label: 'Ethereum',
    count: 12,
    logoUri: 'mock-assets/safe-transaction-assets.safe.global/chains/1/chain_logo.webp',
  },
}

export const Collapsed: Story = { args: { label: 'Behind it', count: 7, collapsed: true } }
