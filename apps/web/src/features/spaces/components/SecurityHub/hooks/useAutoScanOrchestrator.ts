import { useEffect, useMemo, useRef } from 'react'
import type { ScanResult } from '@/features/security/types'
import type { useLoadFeature } from '@/features/__core__'
import type { SecurityContract } from '@/features/security'
import useAutoScan, { type AutoScanServices, type AutoScanState } from '@/features/spaces/hooks/useAutoScan'
import { useCurrentSpaceId } from '@/features/spaces/hooks/useCurrentSpaceId'
import type { OverviewMap, SelectedSafe, SpaceSafeEntry } from '../types'

type SecurityHandle = ReturnType<typeof useLoadFeature<SecurityContract>>

export type UseAutoScanOrchestratorParams = {
  security: SecurityHandle
  deployedEntries: SelectedSafe[]
  safes: SpaceSafeEntry[]
  overviewMap: OverviewMap
  isLoadingSpacesSafes: boolean
  onScanComplete: (address: string, chainId: string, timestamp: number, results: Record<string, ScanResult>) => void
}

/**
 * Wraps `useAutoScan` with two responsibilities pulled out of the host component:
 * - Builds the `AutoScanServices` bundle from the loaded feature handle.
 * - Triggers `startScan()` whenever the queue identity changes (Safes added,
 *   reconciled, or removed). Identity is compared via a sorted, joined key
 *   string so reference churn from other re-renders doesn't re-trigger.
 */
const useAutoScanOrchestrator = ({
  security,
  deployedEntries,
  safes,
  overviewMap,
  isLoadingSpacesSafes,
  onScanComplete,
}: UseAutoScanOrchestratorParams): AutoScanState => {
  const services = useMemo<AutoScanServices | null>(
    () =>
      security.$isReady
        ? {
            scanners: security.scanners,
            scanKey: security.scanKey,
            setCachedScan: security.setCachedScan,
            withScannerTimeout: security.withScannerTimeout,
          }
        : null,
    [security.$isReady, security.scanners, security.scanKey, security.setCachedScan, security.withScannerTimeout],
  )

  const autoScan = useAutoScan(deployedEntries, safes, overviewMap, services, onScanComplete)
  const { startScan } = autoScan

  const currentSpaceId = useCurrentSpaceId()
  const lastScannedSpaceIdRef = useRef(currentSpaceId)
  const lastScannedKeysRef = useRef<string>('')

  useEffect(() => {
    if (isLoadingSpacesSafes || safes.length === 0 || !security.$isReady) return

    // Page stays mounted across sidebar space switches. Force a fresh scan when the
    // space changes so two spaces with overlapping Safes still trigger a rescan.
    if (lastScannedSpaceIdRef.current !== currentSpaceId) {
      lastScannedSpaceIdRef.current = currentSpaceId
      lastScannedKeysRef.current = ''
    }

    const currentKeys = deployedEntries
      .map((e) => security.scanKey(e.address, e.chainId))
      .sort()
      .join(',')
    if (currentKeys !== lastScannedKeysRef.current) {
      lastScannedKeysRef.current = currentKeys
      startScan()
    }
  }, [
    isLoadingSpacesSafes,
    safes.length,
    deployedEntries,
    startScan,
    security.$isReady,
    security.scanKey,
    currentSpaceId,
  ])

  return autoScan
}

export default useAutoScanOrchestrator
