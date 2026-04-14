import { type ReactElement, useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { Box, Typography } from '@mui/material'
import { useSpaceSafes } from '@/features/spaces'
import { isMultiChainSafeItem, type SafeItem, type MultiChainSafeItem } from '@/hooks/safes'
import { useAppSelector } from '@/store'
import { selectUndeployedSafes } from '@/store/slices'
import type { UndeployedSafesState } from '@safe-global/utils/features/counterfactual/store/types'
import type { ScanResult } from '@/features/security/data/scanners/types'
import { scanKey, type SafeGrade } from '@/features/security/data/scanners/utils'
import { SCANNERS } from '@/features/security/data/scanners/registry'
import { getScanResultsCache } from '@/features/security/hooks/useSecurityScan'
import useSafeScanContext from '@/features/spaces/hooks/useSafeScanContext'
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

// Hook: scans one Safe at a time from a queue, reports results
const useAutoScan = (
  queue: SelectedSafe[],
  safes: SpaceSafeEntry[],
  onComplete: (address: string, chainId: string, timestamp: number, results: Record<string, ScanResult>) => void,
) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [scanningKeys, setScanningKeys] = useState<Set<string>>(new Set())
  const [isRunning, setIsRunning] = useState(false)
  const completedRef = useRef<Set<string>>(new Set())
  const scanningRef = useRef<string | null>(null)

  const currentTarget = isRunning && currentIndex < queue.length ? queue[currentIndex] : null
  const currentEntry = currentTarget ? safes.find((s) => s.address === currentTarget.address) : undefined

  const scanContext = useSafeScanContext(currentTarget, currentEntry)

  // Run scanners when context is ready
  useEffect(() => {
    if (!scanContext || !currentTarget || !isRunning) return

    const key = scanKey(currentTarget.address, currentTarget.chainId)
    if (completedRef.current.has(key)) {
      setCurrentIndex((i) => i + 1)
      return
    }

    // Guard: don't re-launch scanners if already scanning this key
    if (scanningRef.current === key) return
    scanningRef.current = key

    let completed = 0
    const total = SCANNERS.length
    const results: Record<string, ScanResult> = {}

    SCANNERS.forEach((scanner) => {
      scanner
        .scan(scanContext)
        .then((result) => {
          results[scanner.id] = result
        })
        .catch((err) => {
          console.error(`[SecurityHub] Scanner ${scanner.id} failed:`, err)
        })
        .finally(() => {
          completed++
          if (completed === total) {
            completedRef.current.add(key)
            scanningRef.current = null
            const timestamp = Date.now()
            // --- TEMPORARY DIAGNOSTIC — remove before merge ---
            const passing = Object.values(results).filter(
              (r) => r.status === 'clear' || r.status === 'not_applicable' || r.status === 'inconclusive',
            ).length
            const total2 = Object.keys(results).length
            console.warn(
              '[AutoScan]',
              key,
              `${passing}/${total2} passing`,
              Object.fromEntries(Object.entries(results).map(([id, r]) => [id, `${r.status}:${r.severity}`])),
            )
            // Share results with useSecurityScan's module-level cache so the drawer reuses
            // them instead of re-scanning when the user opens this Safe's report.
            getScanResultsCache().set(key, { results, timestamp })
            onComplete(currentTarget.address, currentTarget.chainId, timestamp, results)
            setScanningKeys((prev) => {
              const next = new Set(prev)
              next.delete(key)
              return next
            })
            setCurrentIndex((i) => i + 1)
          }
        })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanContext, currentTarget?.address, currentTarget?.chainId, isRunning])

  const [justCompleted, setJustCompleted] = useState(false)
  const completionTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Stop when queue is exhausted, show brief completion state
  useEffect(() => {
    if (isRunning && currentIndex >= queue.length && queue.length > 0) {
      setIsRunning(false)
      setJustCompleted(true)
      clearTimeout(completionTimerRef.current)
      completionTimerRef.current = setTimeout(() => setJustCompleted(false), 2500)
    }
  }, [isRunning, currentIndex, queue.length])

  // Cleanup on unmount only
  useEffect(() => () => clearTimeout(completionTimerRef.current), [])

  const startScan = useCallback(() => {
    completedRef.current = new Set()
    scanningRef.current = null
    // Pre-populate ALL keys as scanning so every row shows a loading state immediately.
    // Each key is removed individually on completion. For multichain parents,
    // `isAnyChainScanning` stays true until the last chain-child finishes.
    setScanningKeys(new Set(queue.map((q) => scanKey(q.address, q.chainId))))
    setCurrentIndex(0)
    setJustCompleted(false)
    setIsRunning(true)
  }, [queue])

  return { scanningKeys, isRunning, justCompleted, startScan }
}

const SecurityHub = (): ReactElement => {
  const { allSafes, isLoading } = useSpaceSafes()
  const undeployedSafes = useAppSelector(selectUndeployedSafes)
  const [selectedSafe, setSelectedSafe] = useState<SelectedSafe | null>(null)
  const [allScanResults, setAllScanResults] = useState<Record<string, Record<string, ScanResult>>>({})
  const [scanTimestamps, setScanTimestamps] = useState<Record<string, number>>({})
  const [gradeFilter, setGradeFilter] = useState<SafeGrade | null>(null)

  const safes = useMemo(() => flattenSafes(allSafes, undeployedSafes), [allSafes, undeployedSafes])

  const deployedEntries = useMemo(() => getDeployedEntries(safes), [safes])

  const handleScanComplete = useCallback(
    (address: string, chainId: string, timestamp: number, results: Record<string, ScanResult>) => {
      const key = scanKey(address, chainId)
      setAllScanResults((prev) => ({ ...prev, [key]: results }))
      setScanTimestamps((prev) => ({ ...prev, [key]: timestamp }))
    },
    [],
  )

  const { scanningKeys, isRunning, startScan } = useAutoScan(deployedEntries, safes, handleScanComplete)

  // Auto-scan when safes are available. Re-triggers if the Safe list changes
  // (e.g., user switches Safes via the selector).
  const lastScannedKeysRef = useRef<string>('')
  useEffect(() => {
    if (isLoading || safes.length === 0) return
    const currentKeys = deployedEntries
      .map((e) => scanKey(e.address, e.chainId))
      .sort()
      .join(',')
    if (currentKeys !== lastScannedKeysRef.current) {
      lastScannedKeysRef.current = currentKeys
      startScan()
    }
  }, [isLoading, safes.length, deployedEntries, startScan])

  const handleViewReport = useCallback((address: string, chainId: string) => {
    setSelectedSafe((prev) => {
      if (prev && prev.address === address && prev.chainId === chainId) return null
      return { address, chainId }
    })
  }, [])

  const selectedEntry = useMemo(() => safes.find((s) => s.address === selectedSafe?.address), [safes, selectedSafe])
  const scanContext = useSafeScanContext(selectedSafe, selectedEntry)

  const handleCloseDrawer = useCallback(() => setSelectedSafe(null), [])

  return (
    <Box data-testid="security-hub">
      <Box mb={3}>
        <Typography variant="h1" mb={0.5}>
          Security
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Security posture across all accounts in this workspace.
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
