import type { GradeSummary } from '@/features/security/types'
import { Skeleton } from '@/components/ui/skeleton'
import { DASH } from './constants'
import { formatBalance } from './utils'

type ScoreCellProps = {
  summary: GradeSummary | null
  isScanning?: boolean
}

/** Numeric score (0–100) out of 100. */
export const ScoreCell = ({ summary, isScanning }: ScoreCellProps) => {
  if (!summary) {
    if (isScanning) return <Skeleton className="h-5 w-[60px]" />
    return <span className="text-sm text-muted-foreground">{DASH}</span>
  }
  const clearRatio = summary.applicableCount > 0 ? summary.passing / summary.applicableCount : 0
  const score = Math.round(clearRatio * 100)

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm font-semibold text-foreground">{score}</span>
      <span className="text-xs text-muted-foreground">/ 100</span>
    </div>
  )
}

/** Compact fiat balance ($1.2K / $3.4M / dash when zero or missing). */
export const BalanceCell = ({ value, isScanning }: { value?: string; isScanning?: boolean }) =>
  !value && isScanning ? (
    <Skeleton className="h-5 w-[50px]" />
  ) : (
    <span className="text-sm font-bold text-foreground">{formatBalance(value)}</span>
  )
