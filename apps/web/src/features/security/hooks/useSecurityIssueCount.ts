import { useState, useEffect, useRef, useCallback } from 'react'
import useSafePageScanContext from './useSafePageScanContext'
import { SCANNERS } from '@/features/security/data/scanners/registry'
import type { ScanResult } from '@/features/security/data/scanners/types'
import { getStrengthLevel, type StrengthLevel } from '@/features/security/data/securityScoring'

/**
 * Lightweight hook that runs security scanners and returns the count of non-clear results.
 * Used by the sidebar chip and the dashboard redirect warning.
 * Caches results to avoid re-scanning on every render.
 */
const useSecurityIssueCount = (): { issueCount: number; strengthLevel: StrengthLevel | null; isScanning: boolean } => {
  const scanContext = useSafePageScanContext()
  const [results, setResults] = useState<Record<string, ScanResult>>({})
  const [isScanning, setIsScanning] = useState(false)
  const scanIdRef = useRef(0)
  const ctxRef = useRef(scanContext)
  ctxRef.current = scanContext

  const ctxKey = scanContext ? `${scanContext.chainId}:${scanContext.safeAddress}` : null

  const runScan = useCallback(() => {
    const ctx = ctxRef.current
    if (!ctx) return

    const currentScanId = ++scanIdRef.current
    const total = SCANNERS.length
    let completed = 0

    setIsScanning(true)
    setResults({})

    SCANNERS.forEach((scanner) => {
      scanner
        .scan(ctx)
        .then((result) => {
          if (scanIdRef.current !== currentScanId) return
          setResults((prev) => ({ ...prev, [scanner.id]: result }))
        })
        .catch(() => {})
        .finally(() => {
          if (scanIdRef.current !== currentScanId) return
          completed++
          if (completed === total) {
            setIsScanning(false)
          }
        })
    })
  }, [])

  useEffect(() => {
    if (ctxKey) {
      runScan()
    }
  }, [ctxKey, runScan])

  const entries = Object.values(results)
  const issueCount = entries.filter((r) => r.status !== 'clear').length
  const total = entries.length
  const clearRatio = total > 0 ? (total - issueCount) / total : 0
  const strengthLevel = total > 0 ? getStrengthLevel(clearRatio) : null

  return { issueCount, strengthLevel, isScanning }
}

export default useSecurityIssueCount
