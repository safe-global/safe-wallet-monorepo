import { type ReactElement, useMemo } from 'react'
import { CircularProgress } from '@mui/material'
import { RefreshCw } from 'lucide-react'
import type { ScanResult, SafeGrade } from '@/features/security/types'
import { SecurityFeature } from '@/features/security'
import { useLoadFeature } from '@/features/__core__'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/utils/cn'
import { HealthSummarySkeleton } from '../SecurityHubSkeleton/SecurityHubSkeleton'
import { getScoreBand, GRADE_RAMP } from '../../scoreBands'
import type { SpaceSafeEntry } from '../../types'

const FILTER_GRADES: SafeGrade[] = ['critical', 'at_risk', 'needs_attention', 'passing']

/**
 * Per-grade verbal language + soft tint for the filter chips. Accent colors come
 * from the shared score ramp (`GRADE_RAMP`); the tint is the soft chip background;
 * the description is surfaced on hover so the chips stay scannable without losing
 * the "why".
 */
const GRADE_META: Record<SafeGrade, { label: string; description: string; tintVar: string }> = {
  critical: {
    label: 'Critical',
    description: 'Severe issues that put funds or control directly at risk. Fix these first.',
    tintVar: 'var(--color-error-background)',
  },
  at_risk: {
    label: 'At risk',
    description: 'Security gaps that weaken protection over time. Address these soon.',
    tintVar: 'var(--color-warning-background)',
  },
  needs_attention: {
    label: 'Needs review',
    description: "Settings worth a closer look to confirm they're intentional and safe.",
    tintVar: 'var(--color-warning1-main)',
  },
  passing: {
    label: 'Healthy',
    description: 'Passing every security check. No action needed.',
    tintVar: 'var(--color-success-background)',
  },
}

// Text color when a chip is active (solid fill). White reads on red/orange/green;
// yellow needs a dark label for contrast.
const CHIP_ACTIVE_TEXT: Record<SafeGrade, string> = {
  critical: '#ffffff',
  at_risk: '#ffffff',
  needs_attention: '#3f2d00',
  passing: '#ffffff',
}

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
  scorePct: number
}

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

/**
 * Radial score gauge — a ring filled to the score, tinted by band. The unfilled
 * arc creates a "complete the circle to 100" pull that a flat bar can't. The
 * number lives inside the ring.
 */
const ScoreGauge = ({ score, color, size = 116 }: { score: number; color: string; size?: number }) => (
  <div className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
    <CircularProgress
      variant="determinate"
      value={100}
      size={size}
      thickness={4}
      sx={{ color: 'var(--color-border-light)' }}
    />
    <CircularProgress
      variant="determinate"
      value={score}
      size={size}
      thickness={4}
      sx={{ color, position: 'absolute', left: 0, '& .MuiCircularProgress-circle': { strokeLinecap: 'round' } }}
    />
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <span className="text-3xl font-bold leading-none tabular-nums tracking-tight">{score}</span>
      <span className="text-muted-foreground text-xs tabular-nums">/ 100</span>
    </div>
  </div>
)

/**
 * Score panel — radial gauge (the hero), grade verdict, compact filter chips and
 * a re-scan affordance. The gauge carries the "complete to 100" feel; the chips
 * carry the breakdown + filtering.
 */
const ScoreCard = ({
  scorePct,
  gradeCounts,
  activeFilter,
  onFilterChange,
  isScanning,
  lastScannedAt,
  lastScannedLabel,
  onRescan,
  scanIncomplete,
}: {
  scorePct: number
  gradeCounts: Record<SafeGrade, number>
  activeFilter: SafeGrade | null
  onFilterChange: (grade: SafeGrade) => void
  isScanning: boolean
  lastScannedAt: number | null
  lastScannedLabel: string
  onRescan: () => void
  scanIncomplete: boolean
}) => {
  // The numeric score maps to a 5-tier band (label + color).
  const band = getScoreBand(scorePct)
  // formatTimestamp capitalises "Just now"; lower the leading char so it reads
  // naturally inside the sentence ("Last scanned just now").
  const readableTime = lastScannedLabel ? lastScannedLabel.charAt(0).toLowerCase() + lastScannedLabel.slice(1) : ''
  return (
    <Card>
      <CardContent>
        <div className="flex items-center gap-6">
          {/* Radial gauge — a single value to "complete to 100", tinted by band. */}
          <ScoreGauge score={scorePct} color={band.color} />
          {/* Verdict + filter chips + re-scan, stacked beside the gauge. */}
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ backgroundColor: band.color }} aria-hidden />
              <span className="text-base font-semibold" style={{ color: band.textColor }}>
                {band.label}
              </span>
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {FILTER_GRADES.filter((grade) => gradeCounts[grade] > 0).map((grade) => (
                <FilterChip
                  key={grade}
                  grade={grade}
                  count={gradeCounts[grade]}
                  active={activeFilter === grade}
                  onClick={() => onFilterChange(grade)}
                />
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" size="sm" onClick={onRescan} disabled={isScanning}>
                <RefreshCw className={isScanning ? 'animate-spin' : ''} />
                {isScanning ? 'Scanning…' : 'Re-scan'}
              </Button>
              <span className="text-muted-foreground text-xs tabular-nums">
                {lastScannedAt ? `Last scanned ${readableTime}` : 'Not scanned yet'}
                {scanIncomplete && !isScanning && (
                  <span className="ml-2" style={{ color: 'var(--color-warning-main)' }}>
                    · Scan didn&apos;t finish — re-scan to update.
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Compact filter chip — count + label, ramp-colored. Soft tint by default,
 * solid fill when it's the active filter. The grade's meaning surfaces on hover
 * (tooltip) so the chips stay scannable + quick to act on without losing the
 * "why". Clicking toggles the table filter for that grade.
 */
const FilterChip = ({
  grade,
  count,
  active,
  onClick,
}: {
  grade: SafeGrade
  count: number
  active: boolean
  onClick: () => void
}) => {
  const meta = GRADE_META[grade]
  const { color, textColor } = GRADE_RAMP[grade]
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[var(--chip-color)]',
            )}
            style={{
              ...({ '--chip-color': color } as React.CSSProperties),
              backgroundColor: active ? color : meta.tintVar,
              color: active ? CHIP_ACTIVE_TEXT[grade] : textColor,
            }}
          >
            {!active && <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} aria-hidden />}
            <span className="font-semibold tabular-nums">{count}</span>
            <span>{meta.label}</span>
          </button>
        }
      />
      <TooltipContent>{meta.description}</TooltipContent>
    </Tooltip>
  )
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
    return { ...counts, scorePct: Math.round(clearRatio * 100) }
  }, [scanResults, security.$isReady])

  // Per-Safe grade counts. Iterate over `safes` (not scanResults) so multichain
  // safes are counted once per distinct grade — not once per chain entry.
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

  if (!aggregate) {
    return <HealthSummarySkeleton />
  }

  const { scorePct } = aggregate
  const lastScannedLabel = lastScannedAt && security.$isReady ? security.formatTimestamp(lastScannedAt) : ''

  return (
    <div className="mb-6">
      <ScoreCard
        scorePct={scorePct}
        gradeCounts={gradeCounts}
        activeFilter={activeFilter}
        onFilterChange={onFilterChange}
        isScanning={isScanning}
        lastScannedAt={lastScannedAt}
        lastScannedLabel={lastScannedLabel}
        onRescan={onRescan}
        scanIncomplete={scanIncomplete}
      />
    </div>
  )
}

export default WorkspaceHealthCard
