import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { GradeSummary } from '@/features/security/types'
import type { SafeHref } from '@/features/spaces/utils/safeHref'
import { Skeleton } from '@safe-global/views/components/ui/skeleton'
import { DASH } from '@safe-global/views/features/spaces/components/SecurityHub/components/SecuritySafesTable/constants'
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

/** Settings → Setup link when a newer contract version is available; empty otherwise. */
export const UpdateCell = ({ href }: { href?: SafeHref }) =>
  href ? (
    <Link
      href={href}
      aria-label="Update contracts"
      onClick={(e) => e.stopPropagation()}
      className="group inline-flex shrink-0 items-center gap-1 rounded text-xs font-bold text-primary no-underline hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      Update
      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
    </Link>
  ) : null
