import { memo, useCallback, useLayoutEffect, useMemo, useRef, useState, type ReactElement } from 'react'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { TableBody, tableVariants } from '@safe-global/views/components/ui/table'
import { cn } from '@safe-global/views/utils/cn'
import { AddToAddressBookProvider } from '../AddToAddressBook'
import { DeleteTxDialogProvider } from '../RowActionsMenu/DeleteTxDialog'
import type { SpaceQueueSection } from '../../../hooks/useSpaceQueue'
import { useSignerWallets } from '../../../hooks/useSignerWallets'
import ChainHeaderRow from '@safe-global/views/features/spaces/components/SpaceQueue/ChainHeaderRow'
import ConflictHeaderRow from '@safe-global/views/features/spaces/components/SpaceQueue/ConflictHeaderRow'
import QueueGroupRow, {
  UP_NEXT_GROUP_LABELS,
} from '@safe-global/views/features/spaces/components/SpaceQueue/QueueGroupRow'
import SafeBandRow from '@safe-global/views/features/spaces/components/SpaceQueue/SafeBandRow'
import QueueSkeletonRow from '@safe-global/views/features/spaces/components/SpaceQueue/QueueSkeletonRow'
import QueueTableHeader from '@safe-global/views/features/spaces/components/SpaceQueue/QueueTableHeader'
import type { QueueGroupBy } from '@safe-global/views/features/spaces/components/SpaceQueue/types'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import useChains from '@/hooks/useChains'
import { toChainInfos } from '../../../utils'
import SpaceQueueRow from '../SpaceQueueRow'
import { getSafeKey } from '../utils'
import { getGroupId, getQueueGroups, getQueueUnits } from './queueGroups'
import { buildGroupedQueueList, buildQueueList, type QueueListItem } from './queueList'
import SafeTitle from './SafeTitle'
import { createScopeStore, PooledScope, ScopePool, type ScopeStore, type ScopeTarget } from './scopePool'

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

type RowProps = { ref: (element: Element | null) => void; 'data-index': number }

const ScopedRow = ({ item, rowProps }: { item: ScopedItem; rowProps: RowProps }): ReactElement =>
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

type VirtualRowProps = {
  item: QueueListItem
  index: number
  scopeStore: ScopeStore
  measureRef: (element: Element | null) => void
  chainConfigs: Chain[]
  onToggleSafe: (safeAddress: string) => void
  onToggleChain: (scopeKey: string) => void
  onToggleGroup: (id: string) => void
}

// Memoized so a scroll re-renders only the rows that enter the window, not every row in it
const VirtualRow = memo(function VirtualRow({
  item,
  index,
  scopeStore,
  measureRef,
  chainConfigs,
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
          safeAddress={item.section.safeAddress}
          title={
            <SafeTitle
              safeAddress={item.section.safeAddress}
              chains={toChainInfos(
                item.section.chains.map(({ chainId }) => chainId),
                chainConfigs,
              )}
            />
          }
          collapsed={item.collapsed}
          summary={item.summary}
          onToggle={() => onToggleSafe(item.section.safeAddress)}
          rowProps={rowProps}
        />
      )
    case 'chain':
      return (
        <ChainHeaderRow
          chain={toChainInfos([item.chainId], chainConfigs)[0]}
          nextNonce={item.nextNonce}
          collapsed={item.collapsed}
          onToggle={() => onToggleChain(item.scopeKey)}
          rowProps={rowProps}
        />
      )
    case 'group':
      return (
        <QueueGroupRow
          label={item.group === 'network' ? undefined : UP_NEXT_GROUP_LABELS[item.group]}
          chain={item.chainId ? toChainInfos([item.chainId], chainConfigs)[0] : undefined}
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
  const { configs } = useChains()
  const [scopeStore] = useState(createScopeStore)
  const [collapsedSafes, setCollapsedSafes] = useState<ReadonlySet<string>>(new Set())
  const [collapsedChains, setCollapsedChains] = useState<ReadonlySet<string>>(new Set())
  const [collapsedGroups, setCollapsedGroups] = useState<ReadonlySet<string>>(new Set())

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
    <AddToAddressBookProvider>
      <DeleteTxDialogProvider>
        {/* Same panel surface as the Space accounts table, so the two line up */}
        <div className="w-full overflow-x-auto rounded-lg border border-transparent bg-[var(--color-background-paper)] pb-2">
          <ScopePool targets={scopeTargets} store={scopeStore} />
          <table
            aria-label="Pending transactions"
            className={cn(
              tableVariants({ variant: 'panel' }),
              'table-fixed',
              groups ? 'min-w-[1224px]' : 'min-w-[1160px]',
            )}
          >
            <QueueTableHeader
              namesSafes={!!groups}
              collapseAll={
                collapseUnit && collapsibleIds.length > 0
                  ? { allCollapsed, count: collapsibleIds.length, unit: collapseUnit, onToggle: toggleAll }
                  : undefined
              }
            />
            <TableBody ref={bodyRef}>
              <QueueSkeletonRow height={paddingTop} rowHeight={ESTIMATED_HEIGHTS.transaction} />
              {virtualItems.map((virtualItem) => {
                const item = items[virtualItem.index]
                return (
                  <VirtualRow
                    key={item.key}
                    item={item}
                    index={virtualItem.index}
                    scopeStore={scopeStore}
                    measureRef={virtualizer.measureElement}
                    chainConfigs={configs}
                    onToggleSafe={onToggleSafe}
                    onToggleChain={onToggleChain}
                    onToggleGroup={onToggleGroup}
                  />
                )
              })}
              <QueueSkeletonRow height={paddingBottom} rowHeight={ESTIMATED_HEIGHTS.transaction} />
            </TableBody>
          </table>
        </div>
      </DeleteTxDialogProvider>
    </AddToAddressBookProvider>
  )
}

export default SpaceQueueTable
