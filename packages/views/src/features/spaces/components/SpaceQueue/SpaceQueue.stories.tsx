import type { ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  tableVariants,
} from '@safe-global/views/components/ui/table'
import { cn } from '@safe-global/views/utils/cn'
import type { ChainInfo } from '@safe-global/views/features/spaces/types'
import ChainHeaderRow from './ChainHeaderRow'
import { QUEUE_TABLE_MIN_WIDTH } from './columns'
import CollapseAllButton from './CollapseAllButton'
import ConflictBracket from './ConflictBracket'
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

// The queue table's own classes, so the bracket meets the panel table's cell insets
const InQueueTable = ({ children }: { children: ReactNode }) => (
  <table className={cn(tableVariants({ variant: 'panel' }), 'table-fixed [&_td]:px-4', QUEUE_TABLE_MIN_WIDTH)}>
    <QueueTableHeader />
    <TableBody>{children}</TableBody>
  </table>
)

// The hover pill and the go-to highlight, held on so the snapshot shows the line over them
const ROW_FILL = {
  hovered: '[&>td]:bg-muted [&>td:first-child]:rounded-l-lg [&>td:last-child]:rounded-r-lg',
  highlighted: '[&>td]:bg-accent [&>td:first-child]:rounded-l-lg [&>td:last-child]:rounded-r-lg',
}

const OptionRow = ({
  option,
  size,
  nonce,
  fill,
}: {
  option: number
  size: number
  nonce: number
  fill?: keyof typeof ROW_FILL
}) => (
  <TableRow data-no-hover={fill ? '' : undefined} className={cn('h-14', fill && ROW_FILL[fill])}>
    <TableCell className="relative py-2 text-center text-sm">
      <ConflictBracket option={option} size={size} nonce={nonce} />
    </TableCell>
    <TableCell colSpan={5} className="py-2 text-sm">
      Option {option} of {size}
      {fill ? ` (${fill})` : ''}
    </TableCell>
  </TableRow>
)

/** One line from under the nonce to the last option: a tick at each option, a curve at the last, over any row fill */
export const ConflictBracketLine: Story = {
  render: () => (
    <InQueueTable>
      <ConflictHeaderRow nonce={42} size={2} />
      <OptionRow option={1} size={2} nonce={42} fill="hovered" />
      <OptionRow option={2} size={2} nonce={42} />
      <ConflictHeaderRow nonce={166} size={3} />
      <OptionRow option={1} size={3} nonce={166} />
      <OptionRow option={2} size={3} nonce={166} fill="highlighted" />
      <OptionRow option={3} size={3} nonce={166} />
    </InQueueTable>
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
