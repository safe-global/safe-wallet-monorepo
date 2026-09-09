import { useCallback, useEffect, useRef, useState } from 'react'
import type { ScanResult, SecurityScanner } from '@/features/security/types'
import type { SecurityContract } from '@/features/security'
import useSafeScanContext, { type OverviewData } from './useSafeScanContext'
import type { SpaceSafeEntry, SelectedSafe } from '../components/SecurityHub'
import { scheduleWhileVisible } from '@/utils/visibility'

// How long to wait for useSafeScanContext before bailing past a target. Guards "ghost-deployed" chains:
// a Safe flagged isDeployed locally but counterfactual in reality 404s, leaving scanContext null forever.
const SCAN_CONTEXT_BAIL_MS = 5_000

// Minimum time a user-triggered re-scan holds its "Scanning..." state, so a fast scan doesn't flip back
// to "Re-scan" instantly and make the click feel like nothing happened.
const MIN_RESCAN_VISIBLE_MS = 1_000

/**
 * Services this hook needs from the security feature. Callers obtain these via
 * useLoadFeature and pass them in once the feature is $isReady.
 */
export type AutoScanServices = {
  scanners: SecurityScanner[]
  scanKey: SecurityContract['scanKey']
  setCachedScan: SecurityContract['setCachedScan']
  withScannerTimeout: SecurityContract['withScannerTimeout']
}

export type AutoScanState = {
  /** Set of scanKey(address, chainId) currently being scanned. */
  scanningKeys: Set<string>
  /** True while the queue is actively advancing through Safes. */
  isRunning: boolean
  /** Briefly true for ~2.5s after the queue drains — useful for success toasts. */
  justCompleted: boolean
  /**
   * True when the last run couldn't scan every Safe (a scanner threw/timed out, or a target was bailed).
   * Partial results are NOT committed, so the UI uses this to explain why the score didn't refresh.
   */
  scanIncomplete: boolean
  /** True only during a user-triggered re-scan (not automatic scans), so the UI can reset and rebuild the gauge. */
  isRescanning: boolean
  /**
   * Kicks off a fresh scan over the current queue. Pass `{ isManual: true }` for
   * an explicit user re-scan so the UI can show a full restart.
   */
  startScan: (options?: { isManual?: boolean }) => void
}

/**
 * Runs security scanners over a queue of Safes, one Safe at a time (scanners per Safe run in parallel,
 * each timeout-guarded). Results are cached in scanResultsCache for the drawer to reuse.
 *
 * @param queue          - Safes to scan, in order.
 * @param safes          - Full SpaceSafeEntry list (used to look up chain context per target).
 * @param overviewMap    - Pre-fetched balances/queued counts, keyed by scanKey.
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
  const [scanIncomplete, setScanIncomplete] = useState(false)
  const [isRescanning, setIsRescanning] = useState(false)
  const completedRef = useRef<Set<string>>(new Set())
  const scanningRef = useRef<string | null>(null)
  const completionTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  // When the current run started — used to keep a manual re-scan visible for a minimum time.
  const scanStartedAtRef = useRef(0)
  // Ref'd to avoid a stale closure — the effect captures the ref, not the callback.
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const currentTarget = isRunning && currentIndex < queue.length ? queue[currentIndex] : null
  const currentEntry = currentTarget ? safes.find((s) => s.address === currentTarget.address) : undefined

  // Reuse SecurityHub's batch-query overviews instead of re-fetching per Safe.
  const currentOverview =
    currentTarget && services ? overviewMap[services.scanKey(currentTarget.address, currentTarget.chainId)] : undefined
  // A user re-scan forces the data queries to refetch so it reflects current on-chain/config, not cache.
  const scanContext = useSafeScanContext(currentTarget, currentEntry, currentOverview, isRescanning)

  // Run scanners when context is ready
  useEffect(() => {
    if (!scanContext || !currentTarget || !isRunning || !services) return

    const { scanners, scanKey, setCachedScan, withScannerTimeout } = services
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
          // Includes withScannerTimeout rejections, so a hung scanner releases the slot and the queue proceeds.
          console.error(`[SecurityHub] Scanner ${scanner.id} failed:`, err)
        })
        .finally(() => {
          completed++
          if (completed === total) {
            completedRef.current.add(key)
            scanningRef.current = null
            setScanningKeys((prev) => {
              const next = new Set(prev)
              next.delete(key)
              return next
            })
            setCurrentIndex((i) => i + 1)

            // Commit only when every scanner produced a result: a thrown/timed-out one is absent from
            // `results`, which would shrink the gauge denominator and shift the score — keep the prior one.
            if (Object.keys(results).length < total) {
              setScanIncomplete(true)
              return
            }

            const timestamp = Date.now()
            // Share to the module-level cache so the drawer reuses these instead of re-scanning.
            setCachedScan(key, results, timestamp)
            onCompleteRef.current(currentTarget.address, currentTarget.chainId, timestamp, results)
          }
        })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanContext, currentTarget?.address, currentTarget?.chainId, isRunning, services])

  // Bail past a target whose scanContext never resolves, else the queue stalls on a ghost-deployed chain
  // (see SCAN_CONTEXT_BAIL_MS). Timer resets on currentTarget change, cleared once scanContext is non-null.
  useEffect(() => {
    if (!currentTarget || !isRunning || !services || scanContext) return
    const key = services.scanKey(currentTarget.address, currentTarget.chainId)

    const bailPastTarget = () => {
      console.warn(
        `[SecurityHub] scan context did not resolve for ${currentTarget.address}:${currentTarget.chainId} within ${SCAN_CONTEXT_BAIL_MS}ms — skipping`,
      )
      completedRef.current.add(key)
      // A bailed target contributes no results → partial run: surface it, leave the committed score (as the commit gate).
      setScanIncomplete(true)
      setScanningKeys((prev) => {
        if (!prev.has(key)) return prev
        const next = new Set(prev)
        next.delete(key)
        return next
      })
      setCurrentIndex((i) => i + 1)
    }

    // Only count down while the tab is visible — see scheduleWhileVisible.
    return scheduleWhileVisible(SCAN_CONTEXT_BAIL_MS, bailPastTarget)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanContext, currentTarget?.address, currentTarget?.chainId, isRunning, services])

  // Stop when queue is exhausted, show brief completion state
  useEffect(() => {
    if (!(isRunning && currentIndex >= queue.length && queue.length > 0)) return

    const finish = () => {
      setIsRunning(false)
      setIsRescanning(false)
      setJustCompleted(true)
      clearTimeout(completionTimerRef.current)
      completionTimerRef.current = setTimeout(() => setJustCompleted(false), 2500)
    }

    // Hold a manual re-scan's "Scanning..." for MIN_RESCAN_VISIBLE_MS; automatic scans finish immediately.
    const remaining = isRescanning ? MIN_RESCAN_VISIBLE_MS - (Date.now() - scanStartedAtRef.current) : 0
    if (remaining <= 0) {
      finish()
      return
    }
    const timer = setTimeout(finish, remaining)
    return () => clearTimeout(timer)
  }, [isRunning, currentIndex, queue.length, isRescanning])

  // Cleanup on unmount only
  useEffect(() => () => clearTimeout(completionTimerRef.current), [])

  const startScan = useCallback(
    (options?: { isManual?: boolean }) => {
      if (!services) return
      completedRef.current = new Set()
      scanningRef.current = null
      setScanIncomplete(false)
      scanStartedAtRef.current = Date.now()
      // Manual re-scans force a fresh backend refetch and hold "Scanning..." briefly; automatic scans do neither.
      setIsRescanning(Boolean(options?.isManual))
      // Pre-populate ALL keys as scanning so every row shows loading immediately; each is removed on
      // completion. For multichain parents, `isAnyChainScanning` stays true until the last child finishes.
      setScanningKeys(new Set(queue.map((q) => services.scanKey(q.address, q.chainId))))
      setCurrentIndex(0)
      setJustCompleted(false)
      setIsRunning(true)
    },
    [queue, services],
  )

  return { scanningKeys, isRunning, justCompleted, scanIncomplete, isRescanning, startScan }
}

export default useAutoScan
