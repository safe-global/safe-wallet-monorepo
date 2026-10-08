import { type ReactElement, useMemo } from 'react'
import type { ScanResult, SafeGrade, ScoreBandDef } from '@/features/security/types'
import { SecurityFeature } from '@/features/security'
import { useLoadFeature } from '@/features/__core__'
import type { SpaceSafeEntry } from '@views/features/spaces/components/SecurityHub/types'
import { WorkspaceHealthCardView } from '@views/features/spaces/components/SecurityHub/components/WorkspaceHealthCard/WorkspaceHealthCardView'

type WorkspaceHealthCardProps = {
  safes: SpaceSafeEntry[]
  scanResults: Record<string, Record<string, ScanResult>>
  isScanning: boolean
  activeFilter: SafeGrade | null
  onFilterChange: (grade: SafeGrade) => void
  lastScannedAt: number | null
  onRescan: () => void
  scanIncomplete?: boolean
}

type AggregateCounts = {
  passing: number
  applicableCount: number
  criticalCount: number
  needsAttentionCount: number
  atRiskCount: number
  hasCriticalIssue: boolean
}

type Aggregate = AggregateCounts & {
  band: ScoreBandDef
  scorePct: number
}

// Pure reducer — no feature-service calls. The score band (label/colour) is derived
// inside the component where useLoadFeature gives access to the scoring utils.
const computeCounts = (scanResults: Record<string, Record<string, ScanResult>>): AggregateCounts | null => {
  let passing = 0
  let applicableCount = 0
  let criticalCount = 0
  let needsAttentionCount = 0
  let atRiskCount = 0
  let hasCriticalIssue = false
  let hasAny = false

  for (const safeResults of Object.values(scanResults)) {
    for (const result of Object.values(safeResults)) {
      if (result.status === 'not_applicable' || result.status === 'inconclusive') continue
      hasAny = true
      applicableCount++
      if (result.status === 'clear') passing++
      if (result.status === 'partial') needsAttentionCount++
      if (result.status === 'issue') atRiskCount++
      if (result.severity === 'Critical') {
        hasCriticalIssue = true
        criticalCount++
      }
    }
  }

  if (!hasAny) return null

  return { passing, applicableCount, criticalCount, needsAttentionCount, atRiskCount, hasCriticalIssue }
}

const WorkspaceHealthCard = ({
  safes,
  scanResults,
  isScanning,
  activeFilter,
  onFilterChange,
  lastScannedAt,
  onRescan,
  scanIncomplete = false,
}: WorkspaceHealthCardProps): ReactElement => {
  const security = useLoadFeature(SecurityFeature)

  const aggregate = useMemo<Aggregate | null>(() => {
    const counts = computeCounts(scanResults)
    if (!counts || !security.$isReady) return null
    const clearRatio = counts.applicableCount > 0 ? counts.passing / counts.applicableCount : 0
    const scorePct = Math.round(clearRatio * 100)
    const band = security.getScoreBand(scorePct, counts.hasCriticalIssue)
    return { ...counts, band, scorePct }
  }, [scanResults, security.$isReady, security.getScoreBand])

  // Per-Safe grade counts for the filter chips.
  // Iterate over `safes` (not scanResults) so multichain safes are counted once per
  // distinct grade — not once per chain entry. This keeps chip counts consistent with
  // the table's filter semantics ("show safes where ANY chain matches this grade").
  const gradeCounts = useMemo(() => {
    const counts: Record<SafeGrade, number> = { critical: 0, at_risk: 0, needs_attention: 0, passing: 0 }
    if (!security.$isReady) return counts
    for (const safe of safes) {
      const gradesFound = new Set<SafeGrade>()
      for (const chain of safe.chainEntries) {
        const key = security.scanKey(safe.address, chain.chainId)
        const results = scanResults[key]
        if (!results) continue
        gradesFound.add(security.getSafeGrade(results))
      }
      for (const grade of gradesFound) counts[grade]++
    }
    return counts
  }, [safes, scanResults, security.$isReady, security.scanKey, security.getSafeGrade])

  return (
    <WorkspaceHealthCardView
      score={aggregate ? { scorePct: aggregate.scorePct, color: aggregate.band.color } : null}
      gradeCounts={gradeCounts}
      isScanning={isScanning}
      activeFilter={activeFilter}
      onFilterChange={onFilterChange}
      lastScannedAt={lastScannedAt}
      lastScannedLabel={lastScannedAt && security.$isReady ? security.formatTimestamp(lastScannedAt) : ''}
      onRescan={onRescan}
      scanIncomplete={scanIncomplete}
    />
  )
}

export default WorkspaceHealthCard
