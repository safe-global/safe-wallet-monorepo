import { useCallback, useEffect, useRef, useState } from 'react'
import type { ScanResult, SecurityScanner } from '@/features/security/types'
import type { SecurityContract } from '@/features/security'
import useSafeScanContext, { type OverviewData } from './useSafeScanContext'
import type { SpaceSafeEntry, SelectedSafe } from '../components/SecurityHub'
import { scheduleWhileVisible } from '@/utils/visibility'

// How long to wait for useSafeScanContext to resolve before bailing past a target.
// Protects against "ghost-deployed" chains: a multichain Safe entry may be flagged
// isDeployed=true locally (because this client's undeployedSafes slice doesn't track it),
// but be counterfactual in reality — the Safe/masterCopies/creation queries then 404 and
// scanContext stays null forever, hanging the sequential queue on that target.
const SCAN_CONTEXT_BAIL_MS = 5_000

// Minimum time a user-triggered re-scan keeps its "Scanning..." state on screen. Without
// this, a fast scan (warm cache / quick backend) flips back to "Re-scan" almost instantly
// and the click feels like nothing happened.
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
   * True when the most recent run couldn't fully scan every Safe — a scanner
   * threw/timed out, or a target was bailed past. Such partial results are NOT
   * committed (the gauge keeps the prior complete score), so this flag lets the
   * UI explain why the score didn't refresh. Reset at the start of each scan.
   */
  scanIncomplete: boolean
  /**
   * True only while a user-triggered re-scan is running (the "Re-scan" button),
   * not for automatic scans on load/queue changes. Lets the UI reset the gauge to
   * a scanning state and rebuild, instead of leaving the prior score on screen.
   */
  isRescanning: boolean
  /**
   * Kicks off a fresh scan over the current queue. Pass `{ isManual: true }` for
   * an explicit user re-scan so the UI can show a full restart.
   */
  startScan: (options?: { isManual?: boolean }) => void
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
  const [scanIncomplete, setScanIncomplete] = useState(false)
  const [isRescanning, setIsRescanning] = useState(false)
  const completedRef = useRef<Set<string>>(new Set())
  const scanningRef = useRef<string | null>(null)
  const completionTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  // When the current run started — used to keep a manual re-scan visible for a minimum time.
  const scanStartedAtRef = useRef(0)
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
  // During a user-triggered re-scan, force the scan's data queries to refetch from the
  // backend so the new scan reflects current on-chain/config state rather than cache.
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
          // Includes "Scanner timed out" rejections from withScannerTimeout — a hung
          // scanner now releases the slot so the queue can proceed to the next Safe.
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

            // Only commit when every scanner produced a result. A thrown/timed-out
            // scanner leaves its id absent from `results`, which would shrink the
            // gauge's denominator and shift the score between scans of an unchanged
            // account. Skip the commit instead — the prior complete score stays put.
            if (Object.keys(results).length < total) {
              setScanIncomplete(true)
              return
            }

            const timestamp = Date.now()
            // Share results with the module-level cache so the drawer reuses them
            // instead of re-scanning when the user opens this Safe's report.
            setCachedScan(key, results, timestamp)
            onCompleteRef.current(currentTarget.address, currentTarget.chainId, timestamp, results)
          }
        })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanContext, currentTarget?.address, currentTarget?.chainId, isRunning, services])

  // Bail past a target whose scanContext never resolves. Without this the entire queue
  // stalls on a ghost-deployed chain (see SCAN_CONTEXT_BAIL_MS comment). The timer resets
  // whenever currentTarget changes and is cleared as soon as scanContext becomes non-null.
  useEffect(() => {
    if (!currentTarget || !isRunning || !services || scanContext) return
    const key = services.scanKey(currentTarget.address, currentTarget.chainId)

    const bailPastTarget = () => {
      console.warn(
        `[SecurityHub] scan context did not resolve for ${currentTarget.address}:${currentTarget.chainId} within ${SCAN_CONTEXT_BAIL_MS}ms — skipping`,
      )
      completedRef.current.add(key)
      // A bailed target contributes no results, so the run is partial — surface it
      // and leave the committed score untouched (same rationale as the commit gate).
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

    // Hold a manual re-scan's "Scanning..." state for a minimum period so it doesn't
    // flash by when results come back fast. Automatic scans finish immediately.
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
      // Manual re-scans force a fresh backend refetch and keep the "Scanning..." state
      // visible for a minimum period; automatic scans on load/queue changes do neither.
      setIsRescanning(Boolean(options?.isManual))
      // Pre-populate ALL keys as scanning so every row shows a loading state immediately.
      // Each key is removed individually on completion. For multichain parents,
      // `isAnyChainScanning` stays true until the last chain-child finishes.
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
