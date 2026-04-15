import { type ReactElement, useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { Box, Typography } from '@mui/material'
import { useSpaceSafes } from '@/features/spaces'
import { isMultiChainSafeItem, type SafeItem, type MultiChainSafeItem } from '@/hooks/safes'
import { useAppSelector } from '@/store'
import { selectUndeployedSafes, selectCurrency } from '@/store/slices'
import type { UndeployedSafesState } from '@safe-global/utils/features/counterfactual/store/types'
import type { ScanResult, SafeGrade } from '@/features/security/types'
import { SecurityFeature } from '@/features/security'
import { useLoadFeature } from '@/features/__core__'
import { useGetMultipleSafeOverviewsQuery } from '@/store/api/gateway'
import useSafeScanContext, { type OverviewData } from '@/features/spaces/hooks/useSafeScanContext'
import useAutoScan, { type AutoScanServices } from '@/features/spaces/hooks/useAutoScan'
import SecuritySafesTable from './SecuritySafesTable'
import SecurityReportDrawer from './SecurityReportDrawer'
import WorkspaceHealthCard from './WorkspaceHealthCard'

export type ChainEntry = {
  chainId: string
  isDeployed: boolean
}

export type SpaceSafeEntry = {
  address: string
  chainId: string
  name?: string
  isMultichain: boolean
  chainEntries: ChainEntry[]
}

export type SelectedSafe = {
  address: string
  chainId: string
}

const flattenSafes = (
  allSafes: Array<SafeItem | MultiChainSafeItem>,
  undeployedSafes: UndeployedSafesState,
): SpaceSafeEntry[] =>
  allSafes.map((item) => {
    if (isMultiChainSafeItem(item)) {
      return {
        address: item.address,
        chainId: item.safes[0]?.chainId ?? '1',
        name: item.name,
        isMultichain: true,
        chainEntries: item.safes.map((s) => ({
          chainId: s.chainId,
          isDeployed: !undeployedSafes[s.chainId]?.[s.address],
        })),
      }
    }
    const isDeployed = !undeployedSafes[item.chainId]?.[item.address]
    return {
      address: item.address,
      chainId: item.chainId,
      name: item.name,
      isMultichain: false,
      chainEntries: [{ chainId: item.chainId, isDeployed }],
    }
  })

// Collect all deployed chain entries across all safes
const getDeployedEntries = (safes: SpaceSafeEntry[]): SelectedSafe[] =>
  safes.flatMap((safe) =>
    safe.chainEntries.filter((c) => c.isDeployed).map((c) => ({ address: safe.address, chainId: c.chainId })),
  )

const SecurityHub = (): ReactElement => {
  const security = useLoadFeature(SecurityFeature)
  const { allSafes, isLoading } = useSpaceSafes()
  const undeployedSafes = useAppSelector(selectUndeployedSafes)
  const [selectedSafe, setSelectedSafe] = useState<SelectedSafe | null>(null)
  const [allScanResults, setAllScanResults] = useState<Record<string, Record<string, ScanResult>>>({})
  const [scanTimestamps, setScanTimestamps] = useState<Record<string, number>>({})
  const [gradeFilter, setGradeFilter] = useState<SafeGrade | null>(null)

  // Build the services bundle passed to useAutoScan. Null until the feature loads.
  const autoScanServices = useMemo<AutoScanServices | null>(
    () =>
      security.$isReady
        ? {
            scanners: security.scanners,
            scanKey: security.scanKey,
            getScanResultsCache: security.getScanResultsCache,
            evictScanCache: security.evictScanCache,
            withScannerTimeout: security.withScannerTimeout,
          }
        : null,
    [
      security.$isReady,
      security.scanners,
      security.scanKey,
      security.getScanResultsCache,
      security.evictScanCache,
      security.withScannerTimeout,
    ],
  )

  const safes = useMemo(() => flattenSafes(allSafes, undeployedSafes), [allSafes, undeployedSafes])

  const deployedEntries = useMemo(() => getDeployedEntries(safes), [safes])

  // Batch overview query — single source of truth for balance/queue data.
  // Shared by both the table (display) and scan context (scanner input),
  // eliminating redundant per-Safe overview API requests during auto-scan.
  const currency = useAppSelector(selectCurrency)
  const safeItems: SafeItem[] = useMemo(
    () =>
      safes.flatMap((safe) =>
        safe.chainEntries
          .filter((c) => c.isDeployed)
          .map((c) => ({
            chainId: c.chainId,
            address: safe.address,
            isReadOnly: false,
            isPinned: false,
            lastVisited: 0,
            name: undefined,
          })),
      ),
    [safes],
  )
  const { data: overviews } = useGetMultipleSafeOverviewsQuery(
    { safes: safeItems, currency },
    { skip: safeItems.length === 0 },
  )
  const { balanceMap, overviewMap } = useMemo(() => {
    const bMap: Record<string, string | undefined> = {}
    const oMap: Record<string, OverviewData> = {}
    if (overviews && security.$isReady) {
      for (const ov of overviews) {
        if (ov.address?.value && ov.chainId) {
          const key = security.scanKey(ov.address.value, ov.chainId)
          bMap[key] = ov.fiatTotal
          oMap[key] = {
            balanceUsd: Number(ov.fiatTotal) || 0,
            queuedTxCount: ov.queued ?? 0,
          }
        }
      }
    }
    return { balanceMap: bMap, overviewMap: oMap }
  }, [overviews, security.$isReady, security.scanKey])

  const handleScanComplete = useCallback(
    (address: string, chainId: string, timestamp: number, results: Record<string, ScanResult>) => {
      if (!security.$isReady) return
      const key = security.scanKey(address, chainId)
      setAllScanResults((prev) => ({ ...prev, [key]: results }))
      setScanTimestamps((prev) => ({ ...prev, [key]: timestamp }))
    },
    [security.$isReady, security.scanKey],
  )

  const { scanningKeys, isRunning, startScan } = useAutoScan(
    deployedEntries,
    safes,
    overviewMap,
    autoScanServices,
    handleScanComplete,
  )

  // Auto-scan when safes are available. Re-triggers if the Safe list changes
  // (e.g., user switches Safes via the selector).
  const lastScannedKeysRef = useRef<string>('')
  useEffect(() => {
    if (isLoading || safes.length === 0 || !security.$isReady) return
    const currentKeys = deployedEntries
      .map((e) => security.scanKey(e.address, e.chainId))
      .sort()
      .join(',')
    if (currentKeys !== lastScannedKeysRef.current) {
      lastScannedKeysRef.current = currentKeys
      startScan()
    }
  }, [isLoading, safes.length, deployedEntries, startScan, security.$isReady, security.scanKey])

  const handleViewReport = useCallback((address: string, chainId: string) => {
    setSelectedSafe((prev) => {
      if (prev && prev.address === address && prev.chainId === chainId) return null
      return { address, chainId }
    })
  }, [])

  const selectedEntry = useMemo(() => safes.find((s) => s.address === selectedSafe?.address), [safes, selectedSafe])
  const drawerOverview =
    selectedSafe && security.$isReady
      ? overviewMap[security.scanKey(selectedSafe.address, selectedSafe.chainId)]
      : undefined
  const scanContext = useSafeScanContext(selectedSafe, selectedEntry, drawerOverview)

  const handleCloseDrawer = useCallback(() => setSelectedSafe(null), [])

  return (
    <Box data-testid="security-hub">
      <Box mb={3}>
        <Typography variant="h1" mb={0.5}>
          Security
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Overview of security checks across your accounts.
        </Typography>
      </Box>

      {isLoading ? (
        <Typography variant="body2" color="text.secondary">
          Loading accounts...
        </Typography>
      ) : safes.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No Safe accounts in this space yet.
        </Typography>
      ) : (
        <>
          <WorkspaceHealthCard
            safes={safes}
            scanResults={allScanResults}
            isScanning={isRunning}
            activeFilter={gradeFilter}
            onFilterChange={(grade) => setGradeFilter((prev) => (prev === grade ? null : grade))}
            lastScannedAt={Object.values(scanTimestamps).length > 0 ? Math.max(...Object.values(scanTimestamps)) : null}
            onRescan={startScan}
          />
          <SecuritySafesTable
            safes={safes}
            onViewReport={handleViewReport}
            selectedSafe={selectedSafe}
            scanResults={allScanResults}
            scanTimestamps={scanTimestamps}
            scanningKeys={scanningKeys}
            gradeFilter={gradeFilter}
            balanceMap={balanceMap}
          />
        </>
      )}

      <SecurityReportDrawer
        selectedSafe={selectedSafe}
        selectedEntry={selectedEntry}
        scanContext={scanContext}
        onClose={handleCloseDrawer}
        onScanComplete={handleScanComplete}
      />
    </Box>
  )
}

export default SecurityHub
