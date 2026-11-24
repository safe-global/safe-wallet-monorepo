import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactElement } from 'react'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { TableBody, tableVariants } from '@safe-global/views/components/ui/table'
import { TooltipDelay } from '@safe-global/views/components/ui/tooltip'
import { cn } from '@safe-global/views/utils/cn'
import { useIsMobile } from '@safe-global/views/hooks/use-mobile'
import { DeleteTxDialogProvider } from '../RowActionsMenu/DeleteTxDialog'
import { AddToAddressBookProvider } from '../QueueParty/AddToAddressBook'
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
import { QUEUE_TABLE_MIN_WIDTH } from '@safe-global/views/features/spaces/components/SpaceQueue/columns'
import type { QueueGroupBy } from '@safe-global/views/features/spaces/components/SpaceQueue/types'
import { QUEUE_TOOLTIP_DELAY } from '@safe-global/views/features/spaces/components/SpaceQueue/tooltip'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import useChains from '@/hooks/useChains'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectQueueCollapseAll, setQueueCollapseAll } from '../../../public/store/spaceQueueViewSlice'
import { toChainInfos } from '../../../utils'
import SpaceQueueRow from '../SpaceQueueRow'
import { getSafeKey } from '../utils'
import { getChainKey, getGroupId, getQueueGroups, getQueueUnits } from './queueGroups'
import { buildGroupedQueueList, buildQueueList, type QueueListItem } from './queueList'
import SafeTitle from './SafeTitle'
import {
  createHighlightStore,
  findTargetGroupId,
  findTargetIndex,
  QueueNavigationContext,
  type QueueTarget,
} from './queueNavigation'
import { createScopeStore, PooledScope, ScopePool, type ScopeStore, type ScopeTarget } from './scopePool'

// First guesses only: each row is measured once rendered
const ESTIMATED_HEIGHTS: Record<QueueListItem['kind'], number> = {
  safe: 44,
  group: 44,
  chain: 32,
  conflict: 36,
  transaction: 56,
}
// Compact rows put the gauge and the action on a second line
const COMPACT_TRANSACTION_HEIGHT = 88

/** Rows rendered beyond each edge of the viewport */
const OVERSCAN = 12

const toggle = (set: ReadonlySet<string>, id: string): Set<string> => {
  const next = new Set(set)
  if (!next.delete(id)) next.add(id)
  return next
}

/** The ids that end up collapsed: the saved Collapse all / Expand all pick, flipped for each id toggled since */
const applyToggles = (
  collapseAll: boolean,
  ids: readonly string[],
  toggled: ReadonlySet<string>,
): ReadonlySet<string> => (collapseAll ? new Set(ids.filter((id) => !toggled.has(id))) : toggled)

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

const ScopedRow = ({
  item,
  rowProps,
  compact,
}: {
  item: ScopedItem
  rowProps: RowProps
  compact: boolean
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
      nextStatus={item.nextStatus}
      canReject={item.canReject}
      safeAddress={item.safeAddress}
      rowProps={rowProps}
      compact={compact}
    />
  )

type VirtualRowProps = {
  item: QueueListItem
  index: number
  scopeStore: ScopeStore
  measureRef: (element: Element | null) => void
  compact: boolean
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
  compact,
  chainConfigs,
  onToggleSafe,
  onToggleChain,
  onToggleGroup,
}: VirtualRowProps): ReactElement {
  const rowProps = { ref: measureRef, 'data-index': index }
  if (isScoped(item)) {
    return (
      <PooledScope target={toTarget(item)} store={scopeStore}>
        <ScopedRow item={item} rowProps={rowProps} compact={compact} />
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

const prefersReducedMotion = (): boolean => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

const SpaceQueueTable = ({
  sections,
  groupBy,
}: {
  sections: SpaceQueueSection[]
  groupBy: QueueGroupBy
}): ReactElement => {
  const signers = useSignerWallets()
  const compact = useIsMobile()
  const transactionHeight = compact ? COMPACT_TRANSACTION_HEIGHT : ESTIMATED_HEIGHTS.transaction
  const { configs } = useChains()
  const [scopeStore] = useState(createScopeStore)
  const dispatch = useAppDispatch()
  // Saved, so a reload opens the queue with every group collapsed or expanded as last picked
  const collapseAll = useAppSelector(selectQueueCollapseAll)
  // Safes and groups toggled one by one since that pick. Not saved: a reload goes back to the pick
  const [toggledSafes, setToggledSafes] = useState<ReadonlySet<string>>(new Set())
  const [toggledGroups, setToggledGroups] = useState<ReadonlySet<string>>(new Set())
  const [collapsedChains, setCollapsedChains] = useState<ReadonlySet<string>>(new Set())

  // The pick changed (here or in another tab), so the one-by-one toggles made against the old one no longer apply
  const [togglesPick, setTogglesPick] = useState(collapseAll)
  if (togglesPick !== collapseAll) {
    setTogglesPick(collapseAll)
    setToggledSafes(new Set())
    setToggledGroups(new Set())
  }

  // Memoized down to `items`, so a scroll render reuses the list instead of rebuilding it
  const groups = useMemo(
    () => (groupBy === 'safe' ? undefined : getQueueGroups(getQueueUnits(sections, signers), groupBy)),
    [groupBy, sections, signers],
  )
  const safeKeys = useMemo(() => sections.map((section) => getSafeKey(section.safeAddress)), [sections])
  const collapsedSafes = useMemo(
    () => applyToggles(collapseAll, safeKeys, toggledSafes),
    [collapseAll, safeKeys, toggledSafes],
  )
  const groupIds = useMemo(() => groups?.filter((group) => group.kind !== 'all').map(getGroupId), [groups])
  const collapsedGroups = useMemo(
    () => (groupIds ? applyToggles(collapseAll, groupIds, toggledGroups) : toggledGroups),
    [groupIds, collapseAll, toggledGroups],
  )
  const items = useMemo(
    () =>
      groups
        ? buildGroupedQueueList({ groups, collapsedGroups })
        : buildQueueList({ sections, collapsedSafes, collapsedChains, signers }),
    [groups, sections, collapsedGroups, collapsedSafes, collapsedChains, signers],
  )

  const collapsibleIds = groupIds ?? safeKeys
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

  // Pins the Nonce and Action cells only while the table is wider than its panel
  const panelRef = useRef<HTMLDivElement>(null)
  const [scrollsX, setScrollsX] = useState(false)
  useLayoutEffect(() => {
    const panel = panelRef.current
    const table = panel?.querySelector('table')
    if (!panel || !table) return
    const update = () => setScrollsX(panel.scrollWidth > panel.clientWidth)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(panel)
    observer.observe(table)
    return () => observer.disconnect()
  }, [])

  const virtualizer = useWindowVirtualizer({
    count: items.length,
    estimateSize: (index) =>
      items[index].kind === 'transaction' ? transactionHeight : ESTIMATED_HEIGHTS[items[index].kind],
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

  // The go-to reads the latest bands through a ref, so the context value, and the rows reading it, stay the same
  const [highlights] = useState(createHighlightStore)
  useEffect(() => highlights.dispose, [highlights])
  const [goToTarget, setGoToTarget] = useState<QueueTarget>()
  const latest = useRef({ groups, collapsedGroups, collapsedSafes })
  latest.current = { groups, collapsedGroups, collapsedSafes }

  const goTo = useCallback((target: QueueTarget) => {
    const { groups, collapsedGroups, collapsedSafes } = latest.current
    // Expanded with the one-by-one toggles, so the saved Collapse all pick stays as it is
    if (groups) {
      const groupId = findTargetGroupId(groups, target)
      if (groupId && collapsedGroups.has(groupId)) setToggledGroups((prev) => toggle(prev, groupId))
    } else {
      const safeKey = getSafeKey(target.safeAddress)
      if (collapsedSafes.has(safeKey)) setToggledSafes((prev) => toggle(prev, safeKey))
      const chainKey = getChainKey(target.safeAddress, target.chainId)
      setCollapsedChains((prev) => (prev.has(chainKey) ? toggle(prev, chainKey) : prev))
    }
    setGoToTarget(target)
  }, [])
  const navigation = useMemo(() => ({ goTo, highlights }), [goTo, highlights])

  // Once the target's band is open, its row is in `items`: scroll it into view and highlight it
  useEffect(() => {
    if (!goToTarget) return
    setGoToTarget(undefined)
    const index = findTargetIndex(items, goToTarget)
    const item = items[index]
    if (item?.kind !== 'transaction') return
    virtualizer.scrollToIndex(index, { align: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
    highlights.highlight(item.item.transaction.id)
  }, [goToTarget, items, virtualizer, highlights])

  const toggleAll = () => {
    setToggledSafes(new Set())
    setToggledGroups(new Set())
    dispatch(setQueueCollapseAll(!allCollapsed))
  }
  const onToggleSafe = useCallback(
    (safeAddress: string) => setToggledSafes((prev) => toggle(prev, getSafeKey(safeAddress))),
    [],
  )
  const onToggleChain = useCallback((scopeKey: string) => setCollapsedChains((prev) => toggle(prev, scopeKey)), [])
  const onToggleGroup = useCallback((id: string) => setToggledGroups((prev) => toggle(prev, id)), [])

  const scopeTargets = getScopeTargets(virtualItems.map((virtualItem) => items[virtualItem.index]))

  return (
    <QueueNavigationContext.Provider value={navigation}>
      <AddToAddressBookProvider>
        <DeleteTxDialogProvider>
          {/* Every tooltip in the table opens after the same delay, those of the shared components it renders too */}
          <TooltipDelay delay={QUEUE_TOOLTIP_DELAY}>
            {/* A container, so a wider table scrolls in the panel instead of widening the page */}
            <div
              ref={panelRef}
              data-scrolls-x={scrollsX ? '' : undefined}
              className="@container w-full overflow-x-auto rounded-lg border border-transparent bg-[var(--color-background-paper)] pb-2 [--table-pin-surface:var(--color-background-paper)]"
            >
              <ScopePool targets={scopeTargets} store={scopeStore} />
              <table
                aria-label="Pending transactions"
                className={cn(
                  tableVariants({ variant: 'panel' }),
                  'table-fixed [&_td]:px-4',
                  !compact && QUEUE_TABLE_MIN_WIDTH,
                )}
              >
                <QueueTableHeader
                  compact={compact}
                  collapseAll={
                    collapseUnit && collapsibleIds.length > 0
                      ? { allCollapsed, count: collapsibleIds.length, unit: collapseUnit, onToggle: toggleAll }
                      : undefined
                  }
                />
                <TableBody ref={bodyRef}>
                  <QueueSkeletonRow height={paddingTop} rowHeight={transactionHeight} compact={compact} />
                  {virtualItems.map((virtualItem) => {
                    const item = items[virtualItem.index]
                    return (
                      <VirtualRow
                        key={item.key}
                        item={item}
                        index={virtualItem.index}
                        scopeStore={scopeStore}
                        measureRef={virtualizer.measureElement}
                        compact={compact}
                        chainConfigs={configs}
                        onToggleSafe={onToggleSafe}
                        onToggleChain={onToggleChain}
                        onToggleGroup={onToggleGroup}
                      />
                    )
                  })}
                  <QueueSkeletonRow height={paddingBottom} rowHeight={transactionHeight} compact={compact} />
                </TableBody>
              </table>
            </div>
          </TooltipDelay>
        </DeleteTxDialogProvider>
      </AddToAddressBookProvider>
    </QueueNavigationContext.Provider>
  )
}

export default SpaceQueueTable
