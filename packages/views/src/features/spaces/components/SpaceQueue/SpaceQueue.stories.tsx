import type { ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@safe-global/views/components/ui/table'
import type { ChainInfo } from '@safe-global/views/features/spaces/types'
import ChainHeaderRow from './ChainHeaderRow'
import { QUEUE_TABLE_MIN_WIDTH } from './columns'
import CollapseAllButton from './CollapseAllButton'
import ConflictHeaderRow from './ConflictHeaderRow'
import QueueSkeletonRow from './QueueSkeletonRow'
import QueueTableHeader from './QueueTableHeader'
import SafeBandRow from './SafeBandRow'
import SafeTitle from './SafeTitle'

const SAFE = '0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6'
const ETHEREUM: ChainInfo = { chainId: '1', chainName: 'Ethereum', chainLogoUri: null, shortName: 'eth' }
const GNOSIS: ChainInfo = { chainId: '100', chainName: 'Gnosis Chain', chainLogoUri: null, shortName: 'gno' }

const InTable = ({ children }: { children: ReactNode }) => (
  <Table>
    <TableBody>{children}</TableBody>
  </Table>
)

const meta = {
  title: 'Features/Spaces/Transactions/QueueRows',
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const SafeBandExpanded: Story = {
  render: () => (
    <InTable>
      <SafeBandRow
        safeAddress={SAFE}
        title={<SafeTitle safeAddress={SAFE} name="Treasury" chains={[ETHEREUM, GNOSIS]} />}
        collapsed={false}
        summary="1 to execute · 2 to sign"
        onToggle={fn()}
      />
    </InTable>
  ),
}

/** A collapsed band sums up the statuses of its hidden transactions */
export const SafeBandCollapsed: Story = {
  render: () => (
    <InTable>
      <SafeBandRow
        safeAddress={SAFE}
        title={<SafeTitle safeAddress={SAFE} chains={[ETHEREUM]} />}
        collapsed
        summary="1 to execute · 2 to sign"
        onToggle={fn()}
      />
    </InTable>
  ),
}

export const ChainHeader: Story = {
  render: () => (
    <InTable>
      <ChainHeaderRow chain={ETHEREUM} nextNonce={56} collapsed={false} onToggle={fn()} />
      <ChainHeaderRow chain={GNOSIS} collapsed onToggle={fn()} />
    </InTable>
  ),
}

export const ConflictHeader: Story = {
  render: () => (
    <InTable>
      <ConflictHeaderRow nonce={57} size={2} />
      <ConflictHeaderRow nonce={58} size={3} />
    </InTable>
  ),
}

/** The label shows while the header row is hovered or focused */
export const CollapseAll: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow className="group/head">
          <TableHead className="text-right">
            <CollapseAllButton allCollapsed={false} count={3} onToggle={fn()} />
          </TableHead>
        </TableRow>
      </TableHeader>
    </Table>
  ),
}

export const TableHeaderRow: Story = {
  render: () => (
    <Table className={`table-fixed ${QUEUE_TABLE_MIN_WIDTH}`}>
      <QueueTableHeader collapseAll={{ allCollapsed: false, count: 3, onToggle: fn() }} />
    </Table>
  ),
}

/** Always skeletons: these rows stand in for the ones outside the rendered window */
export const SkeletonRows: Story = {
  tags: ['skip-visual-test'],
  render: () => (
    <Table className={`table-fixed ${QUEUE_TABLE_MIN_WIDTH}`}>
      <TableBody>
        <QueueSkeletonRow height={168} rowHeight={56} />
      </TableBody>
    </Table>
  ),
}
