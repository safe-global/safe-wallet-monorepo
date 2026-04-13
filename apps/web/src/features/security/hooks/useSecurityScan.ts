import { useState, useCallback, useEffect, useRef } from 'react'
import type { ScanContext, ScanResult } from '../data/scanners/types'
import { SCANNERS } from '../data/scanners/registry'

/**
 * Module-level cache so multiple hook instances sharing the same ctxKey
 * (e.g., sidebar + main security page) reuse results instead of running
 * duplicate scans. Keyed by `chainId:safeAddress`. TTL: 60 seconds.
 */
const CACHE_TTL_MS = 60_000
const scanResultsCache = new Map<string, { results: Record<string, ScanResult>; timestamp: number }>()

export const getScanResultsCache = () => scanResultsCache

const SCANNER_TIMEOUT_MS = 15_000

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Scanner timed out')), ms)),
  ])

export type ScanState = {
  results: Record<string, ScanResult>
  loading: Record<string, boolean>
  errors: Record<string, string>
  isComplete: boolean
  lastScannedAt: number | null
  progress: number
  rescan: () => void
}

const useSecurityScan = (ctx: ScanContext | null): ScanState => {
  const ctxKey = ctx ? `${ctx.chainId}:${ctx.safeAddress}` : null

  // Resolve from module-level cache if fresh results exist
  const cached = ctxKey ? scanResultsCache.get(ctxKey) : undefined
  const resolved = cached && Date.now() - cached.timestamp < CACHE_TTL_MS ? cached : null

  const [results, setResults] = useState<Record<string, ScanResult>>(resolved?.results ?? {})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [lastScannedAt, setLastScannedAt] = useState<number | null>(resolved?.timestamp ?? null)
  const scanIdRef = useRef(0)
  const ctxRef = useRef(ctx)
  ctxRef.current = ctx
  const hasInitialResults = useRef(!!resolved)

  const executeScan = useCallback(
    (scannerId: string, scanFn: () => Promise<ScanResult>, guardId?: number, onAllComplete?: () => void) => {
      setLoading((prev) => ({ ...prev, [scannerId]: true }))

      scanFn()
        .then((result) => {
          if (guardId !== undefined && scanIdRef.current !== guardId) return
          setResults((prev) => ({ ...prev, [scannerId]: result }))
        })
        .catch((err) => {
          if (guardId !== undefined && scanIdRef.current !== guardId) return
          setErrors((prev) => ({ ...prev, [scannerId]: err instanceof Error ? err.message : 'Scan failed' }))
        })
        .finally(() => {
          if (guardId !== undefined && scanIdRef.current !== guardId) return
          setLoading((prev) => ({ ...prev, [scannerId]: false }))
          onAllComplete?.()
        })
    },
    [],
  )

  const runScan = useCallback(() => {
    const currentCtx = ctxRef.current
    if (!currentCtx) return

    const currentScanId = ++scanIdRef.current
    const total = SCANNERS.length
    let completedCount = 0

    setResults({})
    setErrors({})
    setLastScannedAt(null)

    SCANNERS.forEach((scanner) => {
      executeScan(
        scanner.id,
        () => withTimeout(scanner.scan(currentCtx), SCANNER_TIMEOUT_MS),
        currentScanId,
        () => {
          completedCount++
          if (completedCount === total) {
            const now = Date.now()
            setLastScannedAt(now)
            // Write to module-level cache so other hook instances (sidebar) reuse results
            const key = ctxRef.current ? `${ctxRef.current.chainId}:${ctxRef.current.safeAddress}` : null
            if (key) {
              // Read final results from state updater to avoid closure staleness
              setResults((final) => {
                scanResultsCache.set(key, { results: final, timestamp: now })
                return final
              })
            }
          }
        },
      )
    })
  }, [executeScan])

  useEffect(() => {
    if (ctxKey) {
      if (hasInitialResults.current) {
        // Skip auto-scan — we already have results from the caller
        hasInitialResults.current = false
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
  const progress = total > 0 ? Math.round(((total - loadingCount) / total) * 100) : 0

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
