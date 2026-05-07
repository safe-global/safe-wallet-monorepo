import { type ReactElement, useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { Box, Typography } from '@mui/material'
import { useSpaceSafes } from '@/features/spaces'
import { useAppSelector } from '@/store'
import { selectUndeployedSafes, selectCurrency } from '@/store/slices'
import type { ScanResult, SafeGrade } from '@/features/security/types'
import { SecurityFeature } from '@/features/security'
import { useLoadFeature } from '@/features/__core__'
import { useGetMultipleSafeOverviewsQuery } from '@/store/api/gateway'
import useSafeScanContext from '@/features/spaces/hooks/useSafeScanContext'
import useAutoScan, { type AutoScanServices } from '@/features/spaces/hooks/useAutoScan'
import SecuritySafesTable from './components/SecuritySafesTable/SecuritySafesTable'
import SecurityReportDrawer from './components/SecurityReportDrawer/SecurityReportDrawer'
import WorkspaceHealthCard from './components/WorkspaceHealthCard/WorkspaceHealthCard'
import { flattenSafes, getDeployedEntries, reconcileDeployedSafes, toSafeItems } from './utils'
import { BalanceMap, OverviewMap, SelectedSafe } from './types'

const SecurityHub = (): ReactElement => {
  const security = useLoadFeature(SecurityFeature)
  const { allSafes, isLoading: isLoadingSpacesSafes } = useSpaceSafes()
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

  // Raw safes reflect only this client's local undeployed slice; they may flag chains as
  // deployed that CGW has no record of (counterfactual for another space member). We drive
  // the batch overview query off this raw view, then reconcile below.
  const rawSafes = useMemo(() => flattenSafes(allSafes, undeployedSafes), [allSafes, undeployedSafes])

  // Batch overview query — single source of truth for balance/queue data.
  // Shared by both the table (display) and scan context (scanner input),
  // eliminating redundant per-Safe overview API requests during auto-scan.
  const currency = useAppSelector(selectCurrency)
  const safeItems = useMemo(() => toSafeItems(rawSafes), [rawSafes])
  const { data: overviews } = useGetMultipleSafeOverviewsQuery(
    { safes: safeItems, currency },
    { skip: safeItems.length === 0 },
  )

  // Single pass over the batch-overview response:
  //   - `confirmedDeployedKeys`: (chainId, address) pairs CGW actually returned. Missing
  //     locally-deployed entries are ghost-deployed. `null` = inconclusive (still loading
  //     or empty response from a likely transient failure) — don't reconcile.
  //   - `balanceMap` / `overviewMap`: keyed per Safe for table cells and scan context.
  const { confirmedDeployedKeys, balanceMap, overviewMap } = useMemo(() => {
    if (!security.$isReady || !overviews) {
      return { confirmedDeployedKeys: null, balanceMap: {}, overviewMap: {} }
    }

    const confirmed = new Set<string>()
    const { bMap, oMap } = overviews.reduce(
      (acc: { bMap: BalanceMap; oMap: OverviewMap }, ov) => {
        if (!ov.address?.value || !ov.chainId) {
          return acc
        }

        const key = security.scanKey(ov.address.value, ov.chainId)

        confirmed.add(key)

        acc.bMap[key] = ov.fiatTotal
        acc.oMap[key] = { balanceUsd: Number(ov.fiatTotal) || 0, queuedTxCount: ov.queued ?? 0 }

        return acc
      },
      { bMap: {}, oMap: {} },
    )

    return {
      confirmedDeployedKeys: confirmed.size > 0 ? confirmed : null,
      balanceMap: bMap,
      overviewMap: oMap,
    }
  }, [overviews, security.$isReady, security.scanKey])

  const safes = useMemo(
    () => (security.$isReady ? reconcileDeployedSafes(rawSafes, confirmedDeployedKeys, security.scanKey) : rawSafes),
    [rawSafes, confirmedDeployedKeys, security.$isReady, security.scanKey],
  )

  const deployedEntries = useMemo(() => getDeployedEntries(safes), [safes])

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
    if (isLoadingSpacesSafes || safes.length === 0 || !security.$isReady) return
    const currentKeys = deployedEntries
      .map((e) => security.scanKey(e.address, e.chainId))
      .sort()
      .join(',')
    if (currentKeys !== lastScannedKeysRef.current) {
      lastScannedKeysRef.current = currentKeys
      startScan()
    }
  }, [isLoadingSpacesSafes, safes.length, deployedEntries, startScan, security.$isReady, security.scanKey])

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

      {isLoadingSpacesSafes ? (
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
