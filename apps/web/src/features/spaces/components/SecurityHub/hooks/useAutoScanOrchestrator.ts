import { useEffect, useMemo, useRef } from 'react'
import type { ScanResult } from '@/features/security/public/types'
import type { SecurityServices } from '@/features/security/public/services/securityServices'
import useAutoScan, { type AutoScanServices, type AutoScanState } from '../../../hooks/useAutoScan'
import { useCurrentSpaceId } from '../../../public/hooks/useCurrentSpaceId'
import type {
  OverviewMap,
  SelectedSafe,
  SpaceSafeEntry,
} from '@safe-global/views/features/spaces/components/SecurityHub/types'

type SecurityHandle = SecurityServices | undefined

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
 * - Builds the `AutoScanServices` bundle from the security services.
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
      security
        ? {
            scanners: security.scanners,
            scanKey: security.scanKey,
            setCachedScan: security.setCachedScan,
            withScannerTimeout: security.withScannerTimeout,
          }
        : null,
    [security],
  )

  const autoScan = useAutoScan(deployedEntries, safes, overviewMap, services, onScanComplete)
  const { startScan } = autoScan

  const currentSpaceId = useCurrentSpaceId()
  const lastScannedSpaceIdRef = useRef(currentSpaceId)
  const lastScannedKeysRef = useRef<string>('')

  useEffect(() => {
    if (isLoadingSpacesSafes || safes.length === 0 || !security) return

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
  }, [isLoadingSpacesSafes, safes.length, deployedEntries, startScan, security, currentSpaceId])

  return autoScan
}

export default useAutoScanOrchestrator
