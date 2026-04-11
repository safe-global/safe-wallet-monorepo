import { useState, useCallback, useEffect, useRef } from 'react'
import type { ScanContext, ScanResult } from '../data/scanners/types'
import { SCANNERS } from '../data/scanners/registry'

export type ScanState = {
  results: Record<string, ScanResult>
  loading: Record<string, boolean>
  errors: Record<string, string>
  isComplete: boolean
  lastScannedAt: number | null
  progress: number
  rescan: () => void
  rescanOne: (id: string) => void
}

const useSecurityScan = (ctx: ScanContext | null): ScanState => {
  const [results, setResults] = useState<Record<string, ScanResult>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [lastScannedAt, setLastScannedAt] = useState<number | null>(null)
  const scanIdRef = useRef(0)
  const ctxRef = useRef(ctx)
  ctxRef.current = ctx

  const ctxKey = ctx ? `${ctx.chainId}:${ctx.safeAddress}` : null

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
        () => scanner.scan(currentCtx),
        currentScanId,
        () => {
          completedCount++
          if (completedCount === total) {
            setLastScannedAt(Date.now())
          }
        },
      )
    })
  }, [executeScan])

  useEffect(() => {
    if (ctxKey) {
      runScan()
    }
  }, [ctxKey, runScan])

  const loadingCount = Object.values(loading).filter(Boolean).length
  const total = SCANNERS.length
  const progress = total > 0 ? Math.round(((total - loadingCount) / total) * 100) : 0

  const rescanOne = useCallback(
    (id: string) => {
      const currentCtx = ctxRef.current
      if (!currentCtx) return
      const scanner = SCANNERS.find((s) => s.id === id)
      if (!scanner) return

      setErrors((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })

      executeScan(id, () => scanner.scan(currentCtx))
    },
    [executeScan],
  )

  return {
    results,
    loading,
    errors,
    isComplete: loadingCount === 0 && Object.keys(results).length > 0,
    lastScannedAt,
    progress,
    rescan: runScan,
    rescanOne,
  }
}

export default useSecurityScan
