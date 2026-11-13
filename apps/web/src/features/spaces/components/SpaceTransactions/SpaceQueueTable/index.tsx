import { memo, useCallback, useLayoutEffect, useMemo, useRef, useState, type ReactElement } from 'react'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { TableBody, TableHead, TableHeader, TableRow, tableVariants } from '@safe-global/views/components/ui/table'
import { cn } from '@safe-global/views/utils/cn'
import type { QueueGroupBy } from '@safe-global/views/features/spaces/components/SpaceQueue/types'
import { DeleteTxDialogProvider } from '../RowActionsMenu/DeleteTxDialog'
import type { SpaceQueueSection } from '../../../store/spaceQueueApi'
import { useSignerWallets } from '../../../hooks/useSignerWallets'
import SpaceQueueRow, { QUEUE_COLUMNS } from '../SpaceQueueRow'
import { getSafeKey } from '../utils'
import ChainHeaderRow from './ChainHeaderRow'
import CollapseAllButton from './CollapseAllButton'
import ConflictHeaderRow from './ConflictHeaderRow'
import GroupHeaderRow from './GroupHeaderRow'
import { getGroupId, getQueueGroups, getQueueUnits } from './queueGroups'
import { buildGroupedQueueList, buildQueueList, type QueueListItem } from './queueList'
import SafeBandRow from './SafeBandRow'
import { createScopeStore, PooledScope, ScopePool, type ScopeStore, type ScopeTarget } from './scopePool'

// Widths include the cell padding (8px a side, 16px on the outer cells); a wider table spreads its extra width across
// all of them. The fixed ones add up to 968px; the table's 1128px floor leaves the To column 160px before it scrolls.
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
  group: 44,
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
  ['72px', 180],
  ['416px', 140],
  ['calc(100% - 552px)', 72],
  ['calc(100% - 408px)', 40],
  ['calc(100% - 296px)', 64],
  ['calc(100% - 120px)', 72],
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

const COLLAPSE_UNITS: Record<QueueGroupBy, [string, string] | undefined> = {
  status: undefined,
  safe: ['Safe', 'Safes'],
  network: ['network', 'networks'],
  next: ['group', 'groups'],
}

type ScopedItem = Extract<QueueListItem, { kind: 'conflict' | 'transaction' }>

const isScoped = (item: QueueListItem): item is ScopedItem => item.kind === 'conflict' || item.kind === 'transaction'

const toTarget = ({ scopeKey, chainId, safeAddress }: ScopedItem): ScopeTarget => ({ scopeKey, chainId, safeAddress })

/** The Safes and chains of the rendered rows, each once, in order */
const getScopeTargets = (items: QueueListItem[]): ScopeTarget[] => {
  const targets = new Map<string, ScopeTarget>()
  for (const item of items) {
    if (isScoped(item) && !targets.has(item.scopeKey)) targets.set(item.scopeKey, toTarget(item))
  }
  return [...targets.values()]
}

type VirtualRowProps = {
  item: QueueListItem
  index: number
  scopeStore: ScopeStore
  measureRef: (element: Element | null) => void
  onToggleSafe: (safeAddress: string) => void
  onToggleChain: (scopeKey: string) => void
  onToggleGroup: (id: string) => void
}

const ScopedRow = ({
  item,
  rowProps,
}: {
  item: ScopedItem
  rowProps: { ref: (element: Element | null) => void; 'data-index': number }
}): ReactElement =>
  item.kind === 'conflict' ? (
    <ConflictHeaderRow nonce={item.nonce} size={item.size} rowProps={rowProps} />
  ) : (
    <SpaceQueueRow
      item={item.item}
      chainId={item.chainId}
      conflict={item.conflict}
      status={item.status}
      nextNonce={item.nextNonce}
      canReject={item.canReject}
      safeAddress={item.showSafe ? item.safeAddress : undefined}
      rowProps={rowProps}
    />
  )

// Memoized so a scroll re-renders only the rows that enter the window, not every row in it
const VirtualRow = memo(function VirtualRow({
  item,
  index,
  scopeStore,
  measureRef,
  onToggleSafe,
  onToggleChain,
  onToggleGroup,
}: VirtualRowProps): ReactElement {
  const rowProps = { ref: measureRef, 'data-index': index }
  if (isScoped(item)) {
    return (
      <PooledScope target={toTarget(item)} store={scopeStore}>
        <ScopedRow item={item} rowProps={rowProps} />
      </PooledScope>
    )
  }
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
    case 'group':
      return (
        <GroupHeaderRow
          group={item.group}
          chainId={item.chainId}
          count={item.count}
          collapsed={item.collapsed}
          onToggle={() => onToggleGroup(item.id)}
          rowProps={rowProps}
        />
      )
  }
})

const SpaceQueueTable = ({
  sections,
  groupBy,
}: {
  sections: SpaceQueueSection[]
  groupBy: QueueGroupBy
}): ReactElement => {
  const signers = useSignerWallets()
  const [scopeStore] = useState(createScopeStore)
  const [collapsedSafes, setCollapsedSafes] = useState<ReadonlySet<string>>(new Set())
  const [collapsedChains, setCollapsedChains] = useState<ReadonlySet<string>>(new Set())
  const [collapsedGroups, setCollapsedGroups] = useState<ReadonlySet<string>>(new Set())

  // Cached per response, signers and grouping: a poll that changes nothing, or a switch back, recomputes nothing
  const groups = groupBy === 'safe' ? undefined : getQueueGroups(getQueueUnits(sections, signers), groupBy)
  const items = useMemo(
    () =>
      groups
        ? buildGroupedQueueList({ groups, collapsedGroups })
        : buildQueueList({ sections, collapsedSafes, collapsedChains, signers }),
    [groups, sections, collapsedGroups, collapsedSafes, collapsedChains, signers],
  )

  const collapsibleIds = groups
    ? groups.filter((group) => group.kind !== 'all').map(getGroupId)
    : sections.map((section) => getSafeKey(section.safeAddress))
  const collapsedIds = groups ? collapsedGroups : collapsedSafes
  const allCollapsed = collapsibleIds.every((id) => collapsedIds.has(id))
  const collapseUnit = COLLAPSE_UNITS[groupBy]

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

  const toggleAll = () => (groups ? setCollapsedGroups : setCollapsedSafes)(new Set(allCollapsed ? [] : collapsibleIds))
  const onToggleSafe = useCallback(
    (safeAddress: string) => setCollapsedSafes((prev) => toggle(prev, getSafeKey(safeAddress))),
    [],
  )
  const onToggleChain = useCallback((scopeKey: string) => setCollapsedChains((prev) => toggle(prev, scopeKey)), [])
  const onToggleGroup = useCallback((id: string) => setCollapsedGroups((prev) => toggle(prev, id)), [])

  const scopeTargets = getScopeTargets(virtualItems.map((virtualItem) => items[virtualItem.index]))

  return (
    <DeleteTxDialogProvider>
      {/* Same panel surface as the Space accounts table (SafeAccountsTable with `bordered={false}`): it owns the
        horizontal scroll, and its 1px edge stays transparent so nothing shifts against that table */}
      <div className="w-full overflow-x-auto rounded-lg border border-transparent bg-[var(--color-background-paper)] pb-2">
        <ScopePool targets={scopeTargets} store={scopeStore} />
        <table
          aria-label="Pending transactions"
          className={cn(tableVariants({ variant: 'panel' }), 'table-fixed min-w-[1128px]')}
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
                  className={cn(
                    'px-2 py-2.5',
                    label === 'Nonce' && 'px-0! text-center',
                    // The collapse-all button is taller than a label: keep the bar at its 40px height
                    label === 'Action' && 'py-0',
                  )}
                >
                  {label === 'To' ? (
                    <span className="sr-only">{label}</span>
                  ) : label === 'Action' ? (
                    <span className="flex items-center justify-end">
                      <span className="sr-only">{label}</span>
                      {collapseUnit && collapsibleIds.length > 0 && (
                        <CollapseAllButton
                          allCollapsed={allCollapsed}
                          count={collapsibleIds.length}
                          unit={collapseUnit}
                          onToggle={toggleAll}
                        />
                      )}
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
            {virtualItems.map((virtualItem) => {
              const item = items[virtualItem.index]
              return (
                <VirtualRow
                  key={item.key}
                  item={item}
                  index={virtualItem.index}
                  scopeStore={scopeStore}
                  measureRef={virtualizer.measureElement}
                  onToggleSafe={onToggleSafe}
                  onToggleChain={onToggleChain}
                  onToggleGroup={onToggleGroup}
                />
              )
            })}
            <SpacerRow height={paddingBottom} />
          </TableBody>
        </table>
      </div>
    </DeleteTxDialogProvider>
  )
}

export default SpaceQueueTable
