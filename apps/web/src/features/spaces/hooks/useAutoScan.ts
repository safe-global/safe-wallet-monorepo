import { useCallback, useEffect, useRef, useState } from 'react'
import type { ScanResult, SecurityScanner } from '@/features/security/types'
import type { SecurityContract } from '@/features/security'
import useSafeScanContext, { type OverviewData } from '@/features/spaces/hooks/useSafeScanContext'
import type { SpaceSafeEntry, SelectedSafe } from '@/features/spaces/components/SecurityHub'

/**
 * Services this hook needs from the security feature. Callers obtain these via
 * useLoadFeature and pass them in once the feature is $isReady.
 */
export type AutoScanServices = {
  scanners: SecurityScanner[]
  scanKey: SecurityContract['scanKey']
  getScanResultsCache: SecurityContract['getScanResultsCache']
  evictScanCache: SecurityContract['evictScanCache']
  withScannerTimeout: SecurityContract['withScannerTimeout']
}

export type AutoScanState = {
  /** Set of scanKey(address, chainId) currently being scanned. */
  scanningKeys: Set<string>
  /** True while the queue is actively advancing through Safes. */
  isRunning: boolean
  /** Briefly true for ~2.5s after the queue drains — useful for success toasts. */
  justCompleted: boolean
  /** Kicks off a fresh scan over the current queue. */
  startScan: () => void
}

/**
 * Runs security scanners sequentially over a queue of Safes.
 *
 * - Advances one Safe at a time so scanner load stays bounded.
 * - Each Safe's scanners run in parallel, each with a timeout guard.
 * - Completed results are written to the shared scanResultsCache so the
 *   drawer reuses them instead of re-scanning when opened.
 * - Returns {@link AutoScanState} for the host component.
 *
 * @param queue          - Safes to scan, in order.
 * @param safes          - Full SpaceSafeEntry list (used to look up chain context per target).
 * @param overviewMap    - Pre-fetched balances/queued counts, keyed by scanKey.
 *                         Passed through to useSafeScanContext to avoid per-Safe overview requests.
 * @param services       - Security-feature services; hook no-ops while null.
 * @param onComplete     - Invoked with results each time a Safe finishes.
 */
const useAutoScan = (
  queue: SelectedSafe[],
  safes: SpaceSafeEntry[],
  overviewMap: Record<string, OverviewData>,
  services: AutoScanServices | null,
  onComplete: (address: string, chainId: string, timestamp: number, results: Record<string, ScanResult>) => void,
): AutoScanState => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [scanningKeys, setScanningKeys] = useState<Set<string>>(new Set())
  const [isRunning, setIsRunning] = useState(false)
  const [justCompleted, setJustCompleted] = useState(false)
  const completedRef = useRef<Set<string>>(new Set())
  const scanningRef = useRef<string | null>(null)
  const completionTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  // Store onComplete in a ref to avoid stale closure — the effect captures
  // this ref instead of the callback directly.
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const currentTarget = isRunning && currentIndex < queue.length ? queue[currentIndex] : null
  const currentEntry = currentTarget ? safes.find((s) => s.address === currentTarget.address) : undefined

  // Pass pre-fetched overview data to avoid redundant per-Safe API requests.
  // The batch query in SecurityHub already fetches all overviews — reuse that data.
  const currentOverview =
    currentTarget && services ? overviewMap[services.scanKey(currentTarget.address, currentTarget.chainId)] : undefined
  const scanContext = useSafeScanContext(currentTarget, currentEntry, currentOverview)

  // Run scanners when context is ready
  useEffect(() => {
    if (!scanContext || !currentTarget || !isRunning || !services) return

    const { scanners, scanKey, getScanResultsCache, evictScanCache, withScannerTimeout } = services
    const key = scanKey(currentTarget.address, currentTarget.chainId)
    if (completedRef.current.has(key)) {
      setCurrentIndex((i) => i + 1)
      return
    }

    // Guard: don't re-launch scanners if already scanning this key
    if (scanningRef.current === key) return
    scanningRef.current = key

    let completed = 0
    const total = scanners.length
    const results: Record<string, ScanResult> = {}

    scanners.forEach((scanner) => {
      withScannerTimeout(scanner.scan(scanContext))
        .then((result) => {
          results[scanner.id] = result
        })
        .catch((err) => {
          // Includes "Scanner timed out" rejections from withScannerTimeout — a hung
          // scanner now releases the slot so the queue can proceed to the next Safe.
          console.error(`[SecurityHub] Scanner ${scanner.id} failed:`, err)
        })
        .finally(() => {
          completed++
          if (completed === total) {
            completedRef.current.add(key)
            scanningRef.current = null
            const timestamp = Date.now()
            // Share results with useSecurityScan's module-level cache so the drawer reuses
            // them instead of re-scanning when the user opens this Safe's report.
            getScanResultsCache().set(key, { results, timestamp })
            evictScanCache()
            onCompleteRef.current(currentTarget.address, currentTarget.chainId, timestamp, results)
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
  }, [scanContext, currentTarget?.address, currentTarget?.chainId, isRunning, services])

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
    if (!services) return
    completedRef.current = new Set()
    scanningRef.current = null
    // Pre-populate ALL keys as scanning so every row shows a loading state immediately.
    // Each key is removed individually on completion. For multichain parents,
    // `isAnyChainScanning` stays true until the last chain-child finishes.
    setScanningKeys(new Set(queue.map((q) => services.scanKey(q.address, q.chainId))))
    setCurrentIndex(0)
    setJustCompleted(false)
    setIsRunning(true)
  }, [queue, services])

  return { scanningKeys, isRunning, justCompleted, startScan }
}

export default useAutoScan
