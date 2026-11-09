import { memo, useCallback, useLayoutEffect, useMemo, useRef, useState, type ReactElement } from 'react'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { Card, CardContent } from '@safe-global/views/components/ui/card'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@safe-global/views/components/ui/table'
import { SafeScopeProvider } from '@/components/tx-flow/safe-scope/SafeScopeProvider'
import useWallet from '@/hooks/wallets/useWallet'
import type { SpaceQueueSection } from '../../../store/spaceQueueApi'
import SpaceQueueRow, { QUEUE_COLUMNS } from '../SpaceQueueRow'
import { getSafeKey } from '../utils'
import ChainHeaderRow from './ChainHeaderRow'
import CollapseAllButton from './CollapseAllButton'
import ConflictHeaderRow from './ConflictHeaderRow'
import { buildQueueList, groupByScope, type QueueListItem } from './queueList'
import SafeBandRow from './SafeBandRow'

// Widths include the 16px cell padding on each side; a wider table spreads its extra width across all of them.
const COLUMN_WIDTHS: Record<(typeof QUEUE_COLUMNS)[number], string> = {
  Nonce: 'w-16',
  Transaction: 'w-[21.5rem]',
  To: '',
  Proposed: 'w-36',
  Signatures: 'w-28',
  Status: 'w-40',
  Action: 'w-36',
}

// First guesses only: each row is measured once rendered
const ESTIMATED_HEIGHTS: Record<QueueListItem['kind'], number> = {
  safe: 44,
  chain: 32,
  conflict: 36,
  transaction: 56,
}

/** Rows rendered beyond each edge of the viewport */
const OVERSCAN = 12

const toggle = (set: ReadonlySet<string>, id: string): Set<string> => {
  const next = new Set(set)
  if (!next.delete(id)) next.add(id)
  return next
}

// A transaction row's placeholder bars: [left offset, width], laid out like the columns
const SKELETON_BARS: Array<[string, number]> = [
  ['20px', 24],
  ['80px', 180],
  ['424px', 140],
  ['calc(100% - 544px)', 72],
  ['calc(100% - 400px)', 40],
  ['calc(100% - 288px)', 64],
  ['calc(100% - 128px)', 72],
]
const ROW_HEIGHT = ESTIMATED_HEIGHTS.transaction
const BAR_TOP = (ROW_HEIGHT - 12) / 2
const bar = `linear-gradient(to bottom, transparent ${BAR_TOP}px, var(--muted) ${BAR_TOP}px, var(--muted) ${BAR_TOP + 12}px, transparent ${BAR_TOP + 12}px)`
const SKELETON_STYLE = {
  backgroundImage: SKELETON_BARS.map(() => bar).join(', '),
  backgroundSize: SKELETON_BARS.map(([, width]) => `${width}px ${ROW_HEIGHT}px`).join(', '),
  backgroundPosition: SKELETON_BARS.map(([left]) => `${left} 0`).join(', '),
  backgroundRepeat: 'repeat-y',
}

// Stands in for the rows outside the rendered window: one painted cell of skeleton rows, so a fast
// scroll shows placeholders, not a gap, until the real rows render
const SpacerRow = ({ height }: { height: number }): ReactElement | null =>
  height > 0 ? (
    <tr aria-hidden="true" data-no-hover data-no-divider data-testid="space-queue-skeleton">
      <td colSpan={QUEUE_COLUMNS.length} className="p-0!">
        <div className="animate-pulse" style={{ height, ...SKELETON_STYLE }} />
      </td>
    </tr>
  ) : null

type VirtualRowProps = {
  item: QueueListItem
  index: number
  measureRef: (element: Element | null) => void
  onToggleSafe: (safeAddress: string) => void
  onToggleChain: (scopeKey: string) => void
}

// Memoized so a scroll re-renders only the rows that enter the window, not every row in it
const VirtualRow = memo(function VirtualRow({
  item,
  index,
  measureRef,
  onToggleSafe,
  onToggleChain,
}: VirtualRowProps): ReactElement {
  const rowProps = { ref: measureRef, 'data-index': index }
  switch (item.kind) {
    case 'safe':
      return (
        <SafeBandRow
          section={item.section}
          collapsed={item.collapsed}
          summary={item.summary}
          onToggle={() => onToggleSafe(item.section.safeAddress)}
          rowProps={rowProps}
        />
      )
    case 'chain':
      return (
        <ChainHeaderRow
          chainId={item.chainId}
          nextNonce={item.nextNonce}
          collapsed={item.collapsed}
          onToggle={() => onToggleChain(item.scopeKey)}
          rowProps={rowProps}
        />
      )
    case 'conflict':
      return <ConflictHeaderRow nonce={item.nonce} size={item.size} rowProps={rowProps} />
    case 'transaction':
      return (
        <SpaceQueueRow
          item={item.item}
          chainId={item.chainId}
          conflict={item.conflict}
          status={item.status}
          nextNonce={item.nextNonce}
          canReject={item.canReject}
          rowProps={rowProps}
        />
      )
  }
})

const SpaceQueueTable = ({ sections }: { sections: SpaceQueueSection[] }): ReactElement => {
  const wallet = useWallet()
  const [collapsedSafes, setCollapsedSafes] = useState<ReadonlySet<string>>(new Set())
  const [collapsedChains, setCollapsedChains] = useState<ReadonlySet<string>>(new Set())
  const allCollapsed = sections.every((section) => collapsedSafes.has(getSafeKey(section.safeAddress)))

  const items = useMemo(
    () => buildQueueList({ sections, collapsedSafes, collapsedChains, walletAddress: wallet?.address }),
    [sections, collapsedSafes, collapsedChains, wallet?.address],
  )

  // The window scrolls the page, so the virtualizer needs where the rows start on it
  const bodyRef = useRef<HTMLTableSectionElement>(null)
  const [scrollMargin, setScrollMargin] = useState(0)
  useLayoutEffect(() => {
    const body = bodyRef.current
    if (!body) return
    const update = () => setScrollMargin(body.getBoundingClientRect().top + window.scrollY)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(document.body)
    return () => observer.disconnect()
  }, [])

  const virtualizer = useWindowVirtualizer({
    count: items.length,
    estimateSize: (index) => ESTIMATED_HEIGHTS[items[index].kind],
    getItemKey: (index) => items[index].key,
    overscan: OVERSCAN,
    scrollMargin,
    // Let React batch scroll updates instead of rendering synchronously on every scroll event
    useFlushSync: false,
  })
  const virtualItems = virtualizer.getVirtualItems()
  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start - scrollMargin : 0
  const paddingBottom =
    virtualItems.length > 0
      ? virtualizer.getTotalSize() - (virtualItems[virtualItems.length - 1].end - scrollMargin)
      : 0

  const toggleAll = () =>
    setCollapsedSafes(allCollapsed ? new Set() : new Set(sections.map((section) => getSafeKey(section.safeAddress))))
  const onToggleSafe = useCallback(
    (safeAddress: string) => setCollapsedSafes((prev) => toggle(prev, getSafeKey(safeAddress))),
    [],
  )
  const onToggleChain = useCallback((scopeKey: string) => setCollapsedChains((prev) => toggle(prev, scopeKey)), [])

  const renderItem = (item: QueueListItem, index: number): ReactElement => (
    <VirtualRow
      key={item.key}
      item={item}
      index={index}
      measureRef={virtualizer.measureElement}
      onToggleSafe={onToggleSafe}
      onToggleChain={onToggleChain}
    />
  )

  const groups = groupByScope(virtualItems.map((virtualItem) => ({ virtualItem, item: items[virtualItem.index] })))

  return (
    <Card radius="xl" size="none">
      <CardContent>
        <Table
          aria-label="Pending transactions"
          variant="panel"
          className="table-fixed min-w-[1240px] [&_td]:px-4 [&_th]:px-4"
        >
          <colgroup>
            {QUEUE_COLUMNS.map((label) => (
              <col key={label} className={COLUMN_WIDTHS[label]} />
            ))}
          </colgroup>
          <TableHeader>
            <TableRow data-no-hover className="group/head">
              {QUEUE_COLUMNS.map((label) => (
                <TableHead
                  key={label}
                  scope="col"
                  className={`text-xs text-muted-foreground ${label === 'Nonce' ? 'px-0! text-center' : ''}`}
                >
                  {label === 'To' ? (
                    <span className="sr-only">{label}</span>
                  ) : label === 'Action' ? (
                    <span className="flex items-center justify-end">
                      <span className="sr-only">{label}</span>
                      <CollapseAllButton allCollapsed={allCollapsed} count={sections.length} onToggle={toggleAll} />
                    </span>
                  ) : (
                    label
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody ref={bodyRef}>
            <SpacerRow height={paddingTop} />
            {groups.map(({ scopeKey, entries }) => {
              const rows = entries.map(({ virtualItem, item }) => renderItem(item, virtualItem.index))
              const first = entries[0].item
              if (!scopeKey || first.kind === 'safe') return rows
              // One scope per visible run of a Safe's chain: each scope sets up its own provider and SDK
              return (
                <SafeScopeProvider
                  key={`scope-${scopeKey}`}
                  initial={{ chainId: first.chainId, safeAddress: first.safeAddress }}
                  pollSafeInfo={false}
                >
                  {rows}
                </SafeScopeProvider>
              )
            })}
            <SpacerRow height={paddingBottom} />
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export default SpaceQueueTable
