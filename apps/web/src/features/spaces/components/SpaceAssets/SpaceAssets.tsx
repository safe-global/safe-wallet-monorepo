import { useCallback, useLayoutEffect, useMemo, useState, type ReactElement } from 'react'
import { formatCurrency } from '@safe-global/utils/utils/formatNumber'
import SkeletonTxList from '@safe-global/views/components/common/PaginatedTxns/SkeletonTxList'
import SpaceAssetsTable from '@safe-global/views/features/spaces/components/SpaceAssets/SpaceAssetsTable'
import SpaceAssetsToolbar from '@safe-global/views/features/spaces/components/SpaceAssets/SpaceAssetsToolbar'
import SpaceAssetsTotals from '@safe-global/views/features/spaces/components/SpaceAssets/SpaceAssetsTotals'
import {
  SpaceAssetsEmpty,
  SpaceAssetsLoadError,
  SpaceAssetsNoMatches,
} from '@safe-global/views/features/spaces/components/SpaceAssets/SpaceAssetsStates'
import { flattenSafeItems } from '@/hooks/safes/useAllSafesGrouped'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import { useSpaceSafes } from '../../public/hooks/useSpaceSafes'
import useStaggeredLimit from '../../hooks/useStaggeredLimit'
import UnavailableAssetsAlert from './UnavailableAssetsAlert'
import SafeAssets from './SafeAssets'
import { useAssetsToolbar } from './useAssetsToolbar'
import {
  aggregateReports,
  filterAssetsSafes,
  NO_ASSETS_FILTERS,
  toAssetsKey,
  toAssetsSafes,
  type AssetsFilters,
  type ChainAssetsReport,
} from './utils'

const LOAD_BATCH_SIZE = 3
const LOAD_BATCH_DELAY_MS = 300

const isSameReport = (a: ChainAssetsReport | undefined, b: ChainAssetsReport) =>
  a?.state === b.state &&
  a.isPartial === b.isPartial &&
  a.summary?.tokens === b.summary?.tokens &&
  a.summary?.positions === b.summary?.positions

const SpaceAssets = (): ReactElement => {
  const { allSafes, isLoading, isError, refetch } = useSpaceSafes()
  const currency = useAppSelector(selectCurrency)
  const [filters, setFilters] = useState<AssetsFilters>(NO_ASSETS_FILTERS)
  const [reports, setReports] = useState<Record<string, ChainAssetsReport>>({})
  const [retryKey, setRetryKey] = useState(0)
  const [collapsedSafes, setCollapsedSafes] = useState<ReadonlySet<string>>(new Set())
  const [panel, setPanel] = useState<HTMLDivElement | null>(null)
  const [scrollsX, setScrollsX] = useState(false)

  // Pins the first column only while the table is wider than its panel, as in the queue
  useLayoutEffect(() => {
    const table = panel?.querySelector('table')
    if (!panel || !table) return
    const update = () => setScrollsX(panel.scrollWidth > panel.clientWidth)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(panel)
    observer.observe(table)
    return () => observer.disconnect()
  }, [panel])

  const safes = useMemo(() => toAssetsSafes(flattenSafeItems(allSafes)), [allSafes])
  const shownSafes = useMemo(() => filterAssetsSafes(safes, filters), [safes, filters])
  const shownPairs = useMemo(
    () => shownSafes.flatMap((safe) => safe.chainIds.map((chainId) => ({ chainId, safeAddress: safe.address }))),
    [shownSafes],
  )
  const loadLimit = useStaggeredLimit(shownPairs.length, LOAD_BATCH_SIZE, LOAD_BATCH_DELAY_MS)
  const toolbar = useAssetsToolbar(safes, filters, setFilters)

  const onReport = useCallback((chainId: string, address: string, report: ChainAssetsReport) => {
    const key = toAssetsKey(chainId, address)
    setReports((current) => (isSameReport(current[key], report) ? current : { ...current, [key]: report }))
  }, [])

  const {
    summary,
    isLoading: isSummaryLoading,
    isPartial,
  } = aggregateReports(shownPairs.map(({ chainId, safeAddress }) => reports[toAssetsKey(chainId, safeAddress)]))
  const failedPairs = shownPairs.filter(({ chainId, safeAddress }) => {
    const report = reports[toAssetsKey(chainId, safeAddress)]
    return report?.state === 'error' || !!report?.isPartial
  })

  const isCollapsed = (address: string) => collapsedSafes.has(address.toLowerCase())
  const allCollapsed = shownSafes.length > 0 && shownSafes.every((safe) => isCollapsed(safe.address))
  const toggleSafe = (address: string) =>
    setCollapsedSafes((current) => {
      const next = new Set(current)
      if (!next.delete(address.toLowerCase())) next.add(address.toLowerCase())
      return next
    })
  const toggleAll = () =>
    setCollapsedSafes((current) => {
      const next = new Set(current)
      for (const { address } of shownSafes) {
        if (allCollapsed) next.delete(address.toLowerCase())
        else next.add(address.toLowerCase())
      }
      return next
    })

  if (isError) return <SpaceAssetsLoadError onRetry={refetch} />
  if (isLoading) return <SkeletonTxList />
  if (safes.length === 0) return <SpaceAssetsEmpty />

  const firstIndexes = shownSafes.reduce<number[]>(
    (indexes, safe, i) => [...indexes, i === 0 ? 0 : indexes[i - 1] + shownSafes[i - 1].chainIds.length],
    [],
  )

  return (
    <div className="flex flex-col gap-6">
      <SpaceAssetsToolbar {...toolbar} />

      {shownSafes.length === 0 ? (
        <SpaceAssetsNoMatches onClear={toolbar.onClear} />
      ) : (
        <>
          <SpaceAssetsTotals
            total={formatCurrency(summary.tokens + summary.positions, currency)}
            tokens={formatCurrency(summary.tokens, currency)}
            positions={formatCurrency(summary.positions, currency)}
            isLoading={isSummaryLoading}
            isPartial={isPartial}
          />

          {failedPairs.length > 0 && (
            <div className="flex justify-end">
              <UnavailableAssetsAlert safes={failedPairs} onRetry={() => setRetryKey((key) => key + 1)} />
            </div>
          )}

          <SpaceAssetsTable
            panelRef={setPanel}
            scrollsX={scrollsX}
            collapseAll={{ allCollapsed, count: shownSafes.length, onToggle: toggleAll }}
          >
            {shownSafes.map((safe, index) => (
              <SafeAssets
                key={safe.address}
                safe={safe}
                collapsed={isCollapsed(safe.address)}
                onToggle={() => toggleSafe(safe.address)}
                firstIndex={firstIndexes[index]}
                loadLimit={loadLimit}
                retryKey={retryKey}
                reports={reports}
                onReport={onReport}
              />
            ))}
          </SpaceAssetsTable>
        </>
      )}
    </div>
  )
}

export default SpaceAssets
