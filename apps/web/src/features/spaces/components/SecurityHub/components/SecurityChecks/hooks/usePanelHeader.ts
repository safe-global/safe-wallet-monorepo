import { useMemo } from 'react'
import type { ScanResult, ScoreBandDef } from '@/features/security/public/types'
import { useSecurityServices } from '@/features/security/public/hooks/useSecurityServices'

/**
 * Three states the header can be in:
 * - `loading`  — feature still resolving, or no summary yet and scan not complete.
 * - `empty`    — feature ready but `computeSummary` returned nothing (nothing applicable to score).
 * - `ready`    — derived header viewmodel (score / band).
 */
export type PanelHeaderState =
  | { status: 'loading' }
  | { status: 'empty' }
  | {
      status: 'ready'
      score: number
      band: ScoreBandDef
    }

/**
 * Computes the score and score band for the drawer's per-Safe gauge from raw scan
 * results. Keeps the math + feature-handle plumbing out of the view component so the
 * card is a pure render of the viewmodel.
 */
export const usePanelHeader = (results: Record<string, ScanResult>, isComplete: boolean): PanelHeaderState => {
  const security = useSecurityServices()
  const summary = useMemo(() => (security ? security.computeSummary(results) : null), [results, security])

  if (!security || (!isComplete && !summary)) {
    return { status: 'loading' }
  }
  if (!summary) {
    return { status: 'empty' }
  }

  const clearRatio = summary.applicableCount > 0 ? summary.passing / summary.applicableCount : 0
  const score = Math.round(clearRatio * 100)
  const band = security.getScoreBand(score, summary.hasCriticalIssue)

  return { status: 'ready', score, band }
}
