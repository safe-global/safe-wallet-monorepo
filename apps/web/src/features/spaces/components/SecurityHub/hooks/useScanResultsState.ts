import { useCallback, useMemo, useState } from 'react'
import type { ScanResult } from '@/features/security/types'
import type { useLoadFeature } from '@/features/__core__'
import type { SecurityContract } from '@/features/security'
import { useCurrentSpaceId } from '../../../hooks/useCurrentSpaceId'

type SecurityHandle = ReturnType<typeof useLoadFeature<SecurityContract>>

export type ScanResultsByKey = Record<string, Record<string, ScanResult>>
export type ScanTimestampsByKey = Record<string, number>

export type ScanResultsState = {
  allScanResults: ScanResultsByKey
  scanTimestamps: ScanTimestampsByKey
  lastScannedAt: number | null
  handleScanComplete: (address: string, chainId: string, timestamp: number, results: Record<string, ScanResult>) => void
}

/**
 * Owns the per-Safe scan results map, the per-Safe timestamps map, and the
 * `onComplete` callback that auto-scan and the drawer both write through.
 *
 * Resets state when the current space changes — the page stays mounted across
 * sidebar space switches, so without this the workspace card would aggregate
 * the previous space's results and `lastScannedAt` would show its old timestamp.
 *
 * The reset runs during render (not in an effect) using the previous-value
 * pattern. An effect-based reset only clears AFTER the render that already
 * carried the new `currentSpaceId` has committed, so the workspace card paints
 * the previous space's aggregated score for a frame before going to a skeleton.
 * Resetting in render discards that stale output before it's ever committed.
 */
const useScanResultsState = (security: SecurityHandle): ScanResultsState => {
  const currentSpaceId = useCurrentSpaceId()
  const [allScanResults, setAllScanResults] = useState<ScanResultsByKey>({})
  const [scanTimestamps, setScanTimestamps] = useState<ScanTimestampsByKey>({})
  const [trackedSpaceId, setTrackedSpaceId] = useState<string | null>(currentSpaceId)

  if (currentSpaceId && currentSpaceId !== trackedSpaceId) {
    setTrackedSpaceId(currentSpaceId)
    setAllScanResults({})
    setScanTimestamps({})
  }

  const handleScanComplete = useCallback(
    (address: string, chainId: string, timestamp: number, results: Record<string, ScanResult>) => {
      if (!security.$isReady) return
      const key = security.scanKey(address, chainId)
      setAllScanResults((prev) => ({ ...prev, [key]: results }))
      setScanTimestamps((prev) => ({ ...prev, [key]: timestamp }))
    },
    [security.$isReady, security.scanKey],
  )

  const lastScannedAt = useMemo(() => {
    const values = Object.values(scanTimestamps)
    return values.length > 0 ? Math.max(...values) : null
  }, [scanTimestamps])

  return { allScanResults, scanTimestamps, lastScannedAt, handleScanComplete }
}

export default useScanResultsState
