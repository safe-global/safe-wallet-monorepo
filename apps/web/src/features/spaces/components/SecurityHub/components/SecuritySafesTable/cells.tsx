import type { GradeSummary, ScanResult } from '@/features/security/types'
import { getStrengthColor, getStrengthLevel } from '@/features/security/data/securityScoring'
import { Skeleton } from '@/components/ui/skeleton'
import { DASH } from './constants'
import { countChecks, formatBalance, type CheckCounts } from './utils'

type ScoreCellProps = {
  summary: GradeSummary | null
  isScanning?: boolean
}

/** Numeric score (0–100) + colored dot reflecting the strength level. */
export const ScoreCell = ({ summary, isScanning }: ScoreCellProps) => {
  if (!summary) {
    if (isScanning) return <Skeleton className="h-5 w-[60px]" />
    return <span className="text-sm text-muted-foreground">{DASH}</span>
  }
  const clearRatio = summary.applicableCount > 0 ? summary.passing / summary.applicableCount : 0
  const score = Math.round(clearRatio * 100)

  const level = getStrengthLevel(clearRatio, summary.hasCriticalIssue)
  // getStrengthColor returns an MUI palette path (e.g. "success.main"); map it to the
  // matching CSS variable so the inline style renders a real color outside of MUI.
  const dotColor = `var(--color-${getStrengthColor(level).replace('.', '-')})`

  return (
    <div className="flex items-center gap-1.5">
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: dotColor }} />
      <span className="text-sm font-semibold text-foreground">{score}</span>
      <span className="text-xs text-muted-foreground">/ 100</span>
    </div>
  )
}

/** Presentational failed/warning tally (e.g. "1 failed  2 warnings"); dash when all clear. */
export const ChecksCount = ({ failed, warnings }: CheckCounts) => {
  if (!failed && !warnings) {
    return <span className="text-sm text-muted-foreground">{DASH}</span>
  }
  return (
    <div className="flex min-w-0 items-center gap-2">
      {failed > 0 && <span className="whitespace-nowrap text-sm text-muted-foreground">{failed} failed</span>}
      {warnings > 0 && (
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {warnings} warning{warnings === 1 ? '' : 's'}
        </span>
      )}
    </div>
  )
}

/** Failed/warning tally for a single Safe's scan results. */
export const ChecksCell = ({ results, isScanning }: { results?: Record<string, ScanResult>; isScanning?: boolean }) => {
  if (!results && isScanning) return <Skeleton className="h-5 w-[70px]" />
  return <ChecksCount {...countChecks(results)} />
}

/** Compact fiat balance ($1.2K / $3.4M / dash when zero or missing). */
export const BalanceCell = ({ value, isScanning }: { value?: string; isScanning?: boolean }) =>
  !value && isScanning ? (
    <Skeleton className="h-5 w-[50px]" />
  ) : (
    <span className="text-sm font-bold text-foreground">{formatBalance(value)}</span>
  )
