import { useCallback, useMemo, useState, type ReactElement } from 'react'
import { formatCurrency } from '@safe-global/utils/utils/formatNumber'
import SkeletonTxList from '@safe-global/views/components/common/PaginatedTxns/SkeletonTxList'
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

          <div className="flex flex-col gap-3">
            {shownSafes.map((safe, index) => (
              <SafeAssets
                key={safe.address}
                safe={safe}
                firstIndex={firstIndexes[index]}
                loadLimit={loadLimit}
                retryKey={retryKey}
                reports={reports}
                onReport={onReport}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default SpaceAssets
