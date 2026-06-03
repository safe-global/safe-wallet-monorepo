import { type ReactElement, useMemo } from 'react'
import { RefreshCw } from 'lucide-react'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import type { ScanResult, SafeGrade, StrengthLevel } from '@/features/security/types'
import { SecurityFeature } from '@/features/security'
import { useLoadFeature } from '@/features/__core__'
import SafeGradeChip, { SAFE_GRADE_LABEL } from '../SafeGradeChip/SafeGradeChip'
import type { SpaceSafeEntry } from '../../types'
import { ScoreGauge } from './WorkspaceGauge'
import { Button } from '@/components/ui/button'

const FILTER_GRADES: SafeGrade[] = ['critical', 'at_risk', 'needs_attention', 'passing']

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
  level: StrengthLevel
  color: string
  scorePct: number
}

// Pure reducer — no feature-service calls. The strength level/color are derived
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
    const level = security.getStrengthLevel(clearRatio, counts.hasCriticalIssue)
    const color = security.getStrengthColor(level)
    return { ...counts, level, color, scorePct: Math.round(clearRatio * 100) }
  }, [scanResults, security.$isReady, security.getStrengthLevel, security.getStrengthColor])

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

  // Distinct accounts needing attention — a Safe counts once if ANY of its chain entries
  // resolves to a non-`passing` grade (matching the chip/table filter semantics).
  const needsAttentionCount = useMemo(() => {
    if (!security.$isReady) return 0
    return safes.filter((safe) =>
      safe.chainEntries.some((chain) => {
        const results = scanResults[security.scanKey(safe.address, chain.chainId)]
        return results ? security.getSafeGrade(results) !== 'passing' : false
      }),
    ).length
  }, [safes, scanResults, security.$isReady, security.scanKey, security.getSafeGrade])

  // Show skeleton only when we have no data at all. Once any Safe has completed, render the
  // aggregate incrementally — it updates as more results arrive. The re-scan row below
  // surfaces the in-progress state via its "Scanning..." label.
  if (!aggregate) {
    return (
      <Card className="mb-6 flex-col items-start gap-6 p-6 md:flex-row md:items-center">
        <Skeleton className="size-[100px] shrink-0 rounded-full" />
        <div className="min-w-0 flex-1">
          <Skeleton className="mb-2 h-6 w-[180px] rounded" />
          <Skeleton className="mb-1 h-4 w-[320px] rounded" />
          <Skeleton className="mb-4 h-4 w-[260px] rounded" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20 rounded-[10px]" />
            <Skeleton className="h-5 w-[100px] rounded-[10px]" />
          </div>
        </div>
      </Card>
    )
  }

  const { color, level, scorePct } = aggregate

  return (
    <Card className="mb-6 flex-col items-start gap-6 py-5 px-6 md:flex-row md:items-center">
      <ScoreGauge scorePct={scorePct} color={color} />

      <div className="flex min-w-0 flex-1 justify-between">
        <div className="flex -mt-2 flex-col gap-2">
          <Typography variant="h4">{level}</Typography>

          <Typography variant="paragraph-small" color="muted">
            {needsAttentionCount === 0
              ? 'All accounts are healthy'
              : `${needsAttentionCount} of ${safes.length} account${maybePlural(safes.length)} need${
                  needsAttentionCount === 1 ? 's' : ''
                } attention`}
          </Typography>

          <div className="flex flex-wrap gap-2">
            {FILTER_GRADES.filter((grade) => gradeCounts[grade] > 0).map((grade) => (
              <SafeGradeChip
                key={grade}
                grade={grade}
                active={activeFilter === grade}
                label={`${gradeCounts[grade]} ${SAFE_GRADE_LABEL[grade]}`}
                onClick={() => onFilterChange(grade)}
              />
            ))}
          </div>
        </div>

        <div>
          {lastScannedAt && (
            <div className="mt-2 flex flex-col gap-1">
              <Button size="lg" disabled={isScanning} onClick={isScanning ? undefined : onRescan}>
                <RefreshCw className={cn('size-4 text-green-500', isScanning && 'animate-spin')} />

                {isScanning ? 'Scanning...' : 'Re-scan'}
              </Button>

              <Typography variant="paragraph-mini" color="muted">
                Last scanned {security.$isReady ? security.formatTimestamp(lastScannedAt) : ''}
              </Typography>

              {/* <button
                type="button"
                onClick={isScanning ? undefined : onRescan}
                disabled={isScanning}
                className={cn(
                  'flex items-center gap-1',
                  isScanning ? 'cursor-default text-muted-foreground' : 'cursor-pointer text-primary hover:opacity-80',
                )}
              >
                <RefreshCw className="size-3.5" />
                <Typography variant="paragraph-mini-bold" className="text-inherit">

                </Typography>
              </button> */}
            </div>
          )}

          {scanIncomplete && !isScanning && (
            <Typography variant="paragraph-mini" className="mt-0.5 block text-[var(--color-warning-main)]">
              The last scan didn&apos;t finish. Showing your most recent complete score — re-scan to update it.
            </Typography>
          )}
        </div>
      </div>
    </Card>
  )
}

export default WorkspaceHealthCard
