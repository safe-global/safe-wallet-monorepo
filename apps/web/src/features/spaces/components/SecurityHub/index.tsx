import { type ReactElement, type SyntheticEvent, useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { Box, Button, Collapse, Stack, Typography } from '@mui/material'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import { useSpaceSafes } from '@/features/spaces'
import { isMultiChainSafeItem, type SafeItem, type MultiChainSafeItem } from '@/hooks/safes'
import { useAppSelector } from '@/store'
import { selectUndeployedSafes } from '@/store/slices'
import type { UndeployedSafesState } from '@safe-global/utils/features/counterfactual/store/types'
import type { ScanResult } from '@/features/security/data/scanners/types'
import { scanKey } from '@/features/security/data/scanners/utils'
import { SCANNERS } from '@/features/security/data/scanners/registry'
import useSafeScanContext from '@/features/spaces/hooks/useSafeScanContext'
import SecuritySafesTable from './SecuritySafesTable'
import SecurityReport from '@/features/security/components/SecurityReport'
import AuditLog from '@/features/security/components/AuditLog'
import SecurityTabs from '@/features/security/components/SecurityTabs'
import type { DimensionDef } from '@/features/security/data/securityDimensions'
import SearchInput from '../SearchInput'

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

  const currentTarget = isRunning && currentIndex < queue.length ? queue[currentIndex] : null
  const currentEntry = currentTarget ? safes.find((s) => s.address === currentTarget.address) : undefined

  const scanContext = useSafeScanContext(currentTarget, currentEntry)

  // Run scanners when context is ready
  useEffect(() => {
    if (!scanContext || !currentTarget || !isRunning) return

    const key = scanKey(currentTarget.address, currentTarget.chainId)
    if (completedRef.current.has(key)) {
      // Already scanned, advance
      setCurrentIndex((i) => i + 1)
      return
    }

    setScanningKeys((prev) => new Set(prev).add(key))

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
            onComplete(currentTarget.address, currentTarget.chainId, Date.now(), results)
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
    setCurrentIndex(0)
    setJustCompleted(false)
    setIsRunning(true)
  }, [])

  return { scanningKeys, isRunning, justCompleted, startScan }
}

const SecurityHub = (): ReactElement => {
  const { allSafes, isLoading } = useSpaceSafes()
  const undeployedSafes = useAppSelector(selectUndeployedSafes)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSafe, setSelectedSafe] = useState<SelectedSafe | null>(null)
  const [reportTab, setReportTab] = useState(0)
  const [scanTimestamps, setScanTimestamps] = useState<Record<string, number>>({})
  const [allScanResults, setAllScanResults] = useState<Record<string, Record<string, ScanResult>>>({})

  const safes = useMemo(() => flattenSafes(allSafes, undeployedSafes), [allSafes, undeployedSafes])

  const deployedEntries = useMemo(() => getDeployedEntries(safes), [safes])

  const handleBatchScanComplete = useCallback(
    (address: string, chainId: string, timestamp: number, results: Record<string, ScanResult>) => {
      const key = scanKey(address, chainId)
      setScanTimestamps((prev) => ({ ...prev, [key]: timestamp }))
      setAllScanResults((prev) => ({ ...prev, [key]: results }))
    },
    [],
  )

  const { scanningKeys, isRunning, justCompleted, startScan } = useAutoScan(
    deployedEntries,
    safes,
    handleBatchScanComplete,
  )

  // Auto-scan on first load when safes are available
  const hasAutoScanned = useRef(false)
  useEffect(() => {
    if (!isLoading && safes.length > 0 && !hasAutoScanned.current) {
      hasAutoScanned.current = true
      startScan()
    }
  }, [isLoading, safes.length, startScan])

  const filteredSafes = useMemo(() => {
    if (!searchQuery) return safes
    const q = searchQuery.toLowerCase()
    return safes.filter((s) => (s.name ?? '').toLowerCase().includes(q) || s.address.toLowerCase().includes(q))
  }, [safes, searchQuery])

  const handleViewReport = useCallback((address: string, chainId: string) => {
    setSelectedSafe((prev) => {
      if (prev && prev.address === address && prev.chainId === chainId) return null
      return { address, chainId }
    })
    setReportTab(0)
  }, [])

  const handleScanComplete = useCallback(
    (address: string, chainId: string, timestamp: number, results: Record<string, ScanResult>) => {
      const key = scanKey(address, chainId)
      setScanTimestamps((prev) => ({ ...prev, [key]: timestamp }))
      setAllScanResults((prev) => ({ ...prev, [key]: results }))
    },
    [],
  )

  const selectedEntry = useMemo(() => safes.find((s) => s.address === selectedSafe?.address), [safes, selectedSafe])
  const scanContext = useSafeScanContext(selectedSafe, selectedEntry)
  const selectedKey = selectedSafe ? scanKey(selectedSafe.address, selectedSafe.chainId) : null

  return (
    <Box data-testid="security-hub">
      <Typography variant="h1" mb={3}>
        Security hub
      </Typography>

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        flexDirection={{ xs: 'column-reverse', md: 'row' }}
        flexWrap="nowrap"
        gap={2}
        mb={3}
      >
        <SearchInput onSearch={setSearchQuery} />

        <Button
          variant="contained"
          size="small"
          startIcon={justCompleted ? <CheckRoundedIcon /> : <RefreshRoundedIcon />}
          onClick={startScan}
          disabled={isRunning}
          sx={{ whiteSpace: 'nowrap' }}
        >
          {isRunning ? 'Scanning...' : justCompleted ? 'Scan complete' : 'Re-scan all'}
        </Button>
      </Stack>

      {isLoading ? (
        <Typography variant="body2" color="text.secondary">
          Loading accounts...
        </Typography>
      ) : safes.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No Safe accounts in this space yet.
        </Typography>
      ) : filteredSafes.length === 0 ? (
        <Typography variant="h5" fontWeight="normal" color="primary.light">
          No accounts match your search
        </Typography>
      ) : (
        <SecuritySafesTable
          safes={filteredSafes}
          onViewReport={handleViewReport}
          selectedSafe={selectedSafe}
          scanResults={allScanResults}
          scanningKeys={scanningKeys}
        />
      )}

      <Collapse in={!!selectedSafe} timeout={{ enter: 400, exit: 200 }} unmountOnExit>
        <Box mt={5}>
          {selectedSafe && (
            <>
              <SecurityTabs value={reportTab} onChange={(_: SyntheticEvent, v: number) => setReportTab(v)} />

              {reportTab === 0 && (
                <SecurityReport
                  key={selectedKey!}
                  scanContext={scanContext}
                  onScanComplete={handleScanComplete}
                  dimensionFilter={(def: DimensionDef) => def.category === 'account'}
                />
              )}

              {reportTab === 1 && <AuditLog chainId={selectedSafe.chainId} safeAddress={selectedSafe.address} />}
            </>
          )}
        </Box>
      </Collapse>
    </Box>
  )
}

export default SecurityHub
