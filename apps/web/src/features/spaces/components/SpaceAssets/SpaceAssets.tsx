import { useCallback, useLayoutEffect, useMemo, useState, type ReactElement } from 'react'
import { formatCurrency } from '@safe-global/utils/utils/formatNumber'
import SkeletonTxList from '@safe-global/views/components/common/PaginatedTxns/SkeletonTxList'
import { AssetsNoteRow } from '@safe-global/views/features/spaces/components/SpaceAssets/AssetsRows'
import SpaceAssetsTable from '@safe-global/views/features/spaces/components/SpaceAssets/SpaceAssetsTable'
import SpaceAssetsToolbar from '@safe-global/views/features/spaces/components/SpaceAssets/SpaceAssetsToolbar'
import SpaceAssetsTotals from '@safe-global/views/features/spaces/components/SpaceAssets/SpaceAssetsTotals'
import {
  SpaceAssetsEmpty,
  SpaceAssetsLoadError,
  SpaceAssetsNoMatches,
} from '@safe-global/views/features/spaces/components/SpaceAssets/SpaceAssetsStates'
import { useSafeNameResolver } from '@/hooks/useAllAddressBooks'
import { flattenSafeItems } from '@/hooks/safes/useAllSafesGrouped'
import useChains from '@/hooks/useChains'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import { useSpaceSafes } from '../../public/hooks/useSpaceSafes'
import useStaggeredLimit from '../../hooks/useStaggeredLimit'
import SearchTransactions from '../SpaceTransactions/TransactionsToolbar/SearchTransactions'
import AssetsGroups from './AssetsGroups'
import ChainAssetsLoader from './ChainAssetsLoader'
import UnavailableAssetsAlert from './UnavailableAssetsAlert'
import { useAssetsToolbar } from './useAssetsToolbar'
import {
  aggregateReports,
  filterAssetsSafes,
  groupHoldings,
  hasAssetsFilters,
  NO_ASSETS_FILTERS,
  searchHoldings,
  summarizeHoldings,
  toAssetsKey,
  toAssetsSafes,
  type AssetHolding,
  type AssetsFilters,
  type ChainAssetsReport,
} from './utils'

const LOAD_BATCH_SIZE = 3
const LOAD_BATCH_DELAY_MS = 300
const isSameReport = (a: ChainAssetsReport | undefined, b: ChainAssetsReport) =>
  a?.state === b.state && a.isPartial === b.isPartial && a.holdings === b.holdings

const SpaceAssets = (): ReactElement => {
  const { allSafes, isLoading, isError, refetch } = useSpaceSafes()
  const currency = useAppSelector(selectCurrency)
  const { configs } = useChains()
  const getName = useSafeNameResolver()
  const [filters, setFilters] = useState<AssetsFilters>(NO_ASSETS_FILTERS)
  const [search, setSearch] = useState('')
  const [searchKey, setSearchKey] = useState(0)
  const [collapsedByDefault, setCollapsedByDefault] = useState(false)
  const [toggled, setToggled] = useState<ReadonlySet<string>>(new Set())
  const [reports, setReports] = useState<Record<string, ChainAssetsReport>>({})
  const [retryKey, setRetryKey] = useState(0)
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

  const shownReports = useMemo(
    () => shownPairs.map(({ chainId, safeAddress }) => reports[toAssetsKey(chainId, safeAddress)]),
    [shownPairs, reports],
  )
  const { isLoading: isLoadingAssets, loadingCount, isPartial } = aggregateReports(shownReports)
  const failedPairs = shownPairs.filter((_, index) => {
    const report = shownReports[index]
    return report?.state === 'error' || report?.state === 'unsupported' || !!report?.isPartial
  })

  const holdings = useMemo(() => shownReports.flatMap((report) => report?.holdings ?? []), [shownReports])
  const describe = useCallback(
    (holding: AssetHolding) => [
      getName(holding.safeAddress, holding.chainId),
      configs.find((chain) => chain.chainId === holding.chainId)?.chainName ?? '',
    ],
    [getName, configs],
  )
  const searched = useMemo(() => searchHoldings(holdings, search, describe), [holdings, search, describe])
  const groups = useMemo(() => groupHoldings(searched), [searched])
  const summary = summarizeHoldings(searched)

  const isCollapsed = (id: string) => collapsedByDefault !== toggled.has(id)
  const allCollapsed = groups.length > 0 && groups.every((group) => isCollapsed(group.id))
  const toggleGroup = (id: string) =>
    setToggled((current) => {
      const next = new Set(current)
      if (!next.delete(id)) next.add(id)
      return next
    })
  const toggleAll = () => {
    setCollapsedByDefault(!allCollapsed)
    setToggled(new Set())
  }
  const clearAll = () => {
    toolbar.onClear()
    setSearch('')
    setSearchKey((key) => key + 1)
  }

  if (isError) return <SpaceAssetsLoadError onRetry={refetch} />
  if (isLoading) return <SkeletonTxList />
  if (safes.length === 0) return <SpaceAssetsEmpty />

  const isNarrowed = hasAssetsFilters(filters) || search !== ''
  const hasNoMatches =
    shownSafes.length === 0 || (isNarrowed && !isLoadingAssets && groups.length === 0 && failedPairs.length === 0)

  return (
    <div className="flex flex-col gap-6">
      {shownPairs.map(({ chainId, safeAddress }, index) => (
        <ChainAssetsLoader
          key={toAssetsKey(chainId, safeAddress)}
          chainId={chainId}
          address={safeAddress}
          skip={index >= loadLimit}
          retryKey={retryKey}
          onReport={onReport}
        />
      ))}

      <SpaceAssetsTotals
        total={formatCurrency(summary.tokens + summary.positions, currency)}
        tokens={formatCurrency(summary.tokens, currency)}
        positions={formatCurrency(summary.positions, currency)}
        isLoading={isLoadingAssets && holdings.length === 0}
        isPartial={isPartial}
      />

      <SpaceAssetsToolbar
        {...toolbar}
        search={
          <SearchTransactions
            key={searchKey}
            onSearch={setSearch}
            label="Search assets"
            placeholder="Assets, Safes, networks, protocols…"
          />
        }
      />

      {hasNoMatches ? (
        <SpaceAssetsNoMatches onClear={clearAll} />
      ) : (
        <>
          {failedPairs.length > 0 && (
            <div className="flex justify-end">
              <UnavailableAssetsAlert safes={failedPairs} onRetry={() => setRetryKey((key) => key + 1)} />
            </div>
          )}

          <SpaceAssetsTable
            panelRef={setPanel}
            scrollsX={scrollsX}
            collapseAll={
              groups.length > 0
                ? { allCollapsed, count: groups.length, unit: ['group', 'groups'], onToggle: toggleAll }
                : undefined
            }
          >
            <AssetsGroups groups={groups} isCollapsed={isCollapsed} onToggle={toggleGroup} />
            {isLoadingAssets && (
              <AssetsNoteRow isLoading>
                {`Loading the assets of ${loadingCount} more Safe ${loadingCount === 1 ? 'network' : 'networks'}…`}
              </AssetsNoteRow>
            )}
            {!isLoadingAssets && groups.length === 0 && <AssetsNoteRow>No assets</AssetsNoteRow>}
          </SpaceAssetsTable>
        </>
      )}
    </div>
  )
}

export default SpaceAssets
