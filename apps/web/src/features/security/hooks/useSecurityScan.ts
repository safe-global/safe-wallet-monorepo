import { useState, useCallback, useEffect, useRef } from 'react'
import type { ScanContext, ScanResult, ScannerId } from '../data/scanners/types'
import { SCANNERS } from '../data/scanners/registry'
import { scanKey, withScannerTimeout } from '../data/scanners/utils'
import { getCachedScan, setCachedScan } from '../data/scanResultsCache'

export type ScanState = {
  results: Partial<Record<ScannerId, ScanResult>>
  loading: Partial<Record<ScannerId, boolean>>
  errors: Partial<Record<ScannerId, string>>
  isComplete: boolean
  lastScannedAt: number | null
  progress: number
  rescan: () => void
}

const useSecurityScan = (ctx: ScanContext | null): ScanState => {
  const ctxKey = ctx ? scanKey(ctx.safeAddress, ctx.chainId) : null

  const [results, setResults] = useState<Partial<Record<ScannerId, ScanResult>>>({})
  const [loading, setLoading] = useState<Partial<Record<ScannerId, boolean>>>({})
  const [errors, setErrors] = useState<Partial<Record<ScannerId, string>>>({})
  const [lastScannedAt, setLastScannedAt] = useState<number | null>(null)
  const scanIdRef = useRef(0)
  const ctxRef = useRef(ctx)
  ctxRef.current = ctx

  const executeScan = useCallback(
    async (scannerId: ScannerId, scanFn: () => Promise<ScanResult>, guardId?: number, onAllComplete?: () => void) => {
      setLoading((prev) => ({ ...prev, [scannerId]: true }))

      try {
        const result = await scanFn()
        if (guardId !== undefined && scanIdRef.current !== guardId) return
        setResults((prev) => ({ ...prev, [scannerId]: result }))
      } catch (err: unknown) {
        if (guardId !== undefined && scanIdRef.current !== guardId) return
        setErrors((prev) => ({ ...prev, [scannerId]: err instanceof Error ? err.message : 'Scan failed' }))
      } finally {
        if (guardId !== undefined && scanIdRef.current !== guardId) return
        setLoading((prev) => ({ ...prev, [scannerId]: false }))
        onAllComplete?.()
      }
    },
    [],
  )

  const runScan = useCallback(() => {
    const currentCtx = ctxRef.current
    if (!currentCtx) return

    const currentScanId = ++scanIdRef.current
    const total = SCANNERS.length
    let completedCount = 0
    // Local accumulator — avoids reading state from inside a setState updater
    // (which would violate React's purity contract and double-fire under StrictMode).
    const accumulatedResults: Partial<Record<ScannerId, ScanResult>> = {}

    setResults({})
    setErrors({})
    setLastScannedAt(null)

    SCANNERS.forEach((scanner) => {
      executeScan(
        scanner.id,
        async () => {
          const result = await withScannerTimeout(scanner.scan(currentCtx))
          // Capture into the local accumulator before returning so the completion
          // callback can write the cache without reading from setState.
          accumulatedResults[scanner.id] = result
          return result
        },
        currentScanId,
        () => {
          completedCount++
          if (completedCount === total) {
            const now = Date.now()
            setLastScannedAt(now)
            // Share results with module-level cache so other hook instances (sidebar) reuse them.
            const key = ctxRef.current ? scanKey(ctxRef.current.safeAddress, ctxRef.current.chainId) : null
            if (key) setCachedScan(key, accumulatedResults, now)
          }
        },
      )
    })
  }, [executeScan])

  useEffect(() => {
    if (ctxKey) {
      // Check cache when ctxKey first becomes available — not just on mount.
      // When the drawer opens, ctx starts as null (queries loading) so the mount-time
      // cache check misses. By the time ctx resolves, we need to check again here.
      const cached = getCachedScan(ctxKey)
      if (cached) {
        setResults(cached.results)
        setLastScannedAt(cached.timestamp)
        return
      }
      runScan()
    } else {
      // Context went null (Safe switching) — clear stale results and reject in-flight scans
      scanIdRef.current++
      setResults({})
      setErrors({})
      setLastScannedAt(null)
    }
  }, [ctxKey, runScan])

  const loadingCount = Object.values(loading).filter(Boolean).length
  const total = SCANNERS.length
  // Use settled count, not (total - loadingCount): loading starts empty so loadingCount
  // is 0 before any scanner has started, which would incorrectly report 100% progress.
  const settledCount = Object.keys(results).length + Object.keys(errors).length
  const progress = total > 0 ? Math.round((settledCount / total) * 100) : 0

  return {
    results,
    loading,
    errors,
    isComplete: loadingCount === 0 && Object.keys(results).length > 0,
    lastScannedAt,
    progress,
    rescan: runScan,
  }
}

export default useSecurityScan
