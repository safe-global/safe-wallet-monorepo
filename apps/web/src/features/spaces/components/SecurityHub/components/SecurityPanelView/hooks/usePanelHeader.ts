import { useMemo } from 'react'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import type { ScanResult, ScoreBandDef } from '@/features/security/types'
import { SecurityFeature } from '@/features/security'
import { useLoadFeature } from '@/features/__core__'

/**
 * Three states the header can be in:
 * - `loading`  — feature still resolving, or no summary yet and scan not complete.
 * - `empty`    — feature ready but `computeSummary` returned nothing (nothing applicable to score).
 * - `ready`    — derived header viewmodel (score / band / action line).
 */
export type PanelHeaderState =
  | { status: 'loading' }
  | { status: 'empty' }
  | {
      status: 'ready'
      score: number
      band: ScoreBandDef
      actionLine: string
    }

/**
 * Computes the score, score band, and action line for the panel header from raw scan
 * results. Keeps the math + feature-handle plumbing out of the view component so the
 * header is a pure render of the viewmodel.
 */
export const usePanelHeader = (results: Record<string, ScanResult>, isComplete: boolean): PanelHeaderState => {
  const security = useLoadFeature(SecurityFeature)
  const summary = useMemo(
    () => (security.$isReady ? security.computeSummary(results) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [results, security.$isReady, security.computeSummary],
  )

  if (!security.$isReady || (!isComplete && !summary)) return { status: 'loading' }
  if (!summary) return { status: 'empty' }

  const clearRatio = summary.applicableCount > 0 ? summary.passing / summary.applicableCount : 0
  const score = Math.round(clearRatio * 100)
  const band = security.getScoreBand(score, summary.hasCriticalIssue)
  const failureCount = summary.applicableCount - summary.passing
  const actionLine =
    failureCount === 0 ? 'All checks passing.' : `${failureCount} issue${maybePlural(failureCount)} need attention.`

  return { status: 'ready', score, band, actionLine }
}
