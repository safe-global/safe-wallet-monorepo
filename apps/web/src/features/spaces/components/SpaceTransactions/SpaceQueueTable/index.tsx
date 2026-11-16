import { memo, useCallback, useLayoutEffect, useMemo, useRef, useState, type ReactElement } from 'react'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { TableBody, tableVariants } from '@safe-global/views/components/ui/table'
import { cn } from '@safe-global/views/utils/cn'
import { SafeScopeProvider } from '@/components/tx-flow/safe-scope/SafeScopeProvider'
import { DeleteTxDialogProvider } from '../RowActionsMenu/DeleteTxDialog'
import useWallet from '@/hooks/wallets/useWallet'
import type { SpaceQueueSection } from '../../../hooks/useSpaceQueue'
import ChainHeaderRow from '@safe-global/views/features/spaces/components/SpaceQueue/ChainHeaderRow'
import ConflictHeaderRow from '@safe-global/views/features/spaces/components/SpaceQueue/ConflictHeaderRow'
import SafeBandRow from '@safe-global/views/features/spaces/components/SpaceQueue/SafeBandRow'
import QueueSkeletonRow from '@safe-global/views/features/spaces/components/SpaceQueue/QueueSkeletonRow'
import QueueTableHeader from '@safe-global/views/features/spaces/components/SpaceQueue/QueueTableHeader'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import useChains from '@/hooks/useChains'
import { toChainInfos } from '../../../utils'
import SpaceQueueRow from '../SpaceQueueRow'
import { getSafeKey } from '../utils'
import { buildQueueList, groupByScope, type QueueListItem } from './queueList'
import SafeTitle from './SafeTitle'

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

type VirtualRowProps = {
  item: QueueListItem
  index: number
  measureRef: (element: Element | null) => void
  chainConfigs: Chain[]
  onToggleSafe: (safeAddress: string) => void
  onToggleChain: (scopeKey: string) => void
}

// Memoized so a scroll re-renders only the rows that enter the window, not every row in it
const VirtualRow = memo(function VirtualRow({
  item,
  index,
  measureRef,
  chainConfigs,
  onToggleSafe,
  onToggleChain,
}: VirtualRowProps): ReactElement {
  const rowProps = { ref: measureRef, 'data-index': index }
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
  const { configs } = useChains()
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
      chainConfigs={configs}
      onToggleSafe={onToggleSafe}
      onToggleChain={onToggleChain}
    />
  )

  const groups = groupByScope(virtualItems.map((virtualItem) => ({ virtualItem, item: items[virtualItem.index] })))

  return (
    <DeleteTxDialogProvider>
      {/* Same panel surface as the Space accounts table, so the two line up */}
      <div className="w-full overflow-x-auto rounded-lg border border-transparent bg-[var(--color-background-paper)] pb-2">
        <table
          aria-label="Pending transactions"
          className={cn(tableVariants({ variant: 'panel' }), 'table-fixed min-w-[1128px]')}
        >
          <QueueTableHeader allCollapsed={allCollapsed} safeCount={sections.length} onToggleAll={toggleAll} />
          <TableBody ref={bodyRef}>
            <QueueSkeletonRow height={paddingTop} rowHeight={ESTIMATED_HEIGHTS.transaction} />
            {groups.map(({ scopeKey, entries }) => {
              const rows = entries.map(({ virtualItem, item }) => renderItem(item, virtualItem.index))
              const first = entries[0].item
              if (!scopeKey || first.kind === 'safe') return rows
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
            <QueueSkeletonRow height={paddingBottom} rowHeight={ESTIMATED_HEIGHTS.transaction} />
          </TableBody>
        </table>
      </div>
    </DeleteTxDialogProvider>
  )
}

export default SpaceQueueTable
