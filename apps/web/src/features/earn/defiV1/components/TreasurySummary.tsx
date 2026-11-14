import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Progress } from '@safe-global/views/components/ui/progress'
import { cn } from '@safe-global/views/utils/cn'
import { DEFI_V1_COPY, formatApy, formatCompactUsd, formatUsd } from '../copy'
import type { TreasurySummary as Summary } from '../shelf'

const percent = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 0 })
const COPY = DEFI_V1_COPY.summary

const StatCard = ({
  label,
  aside,
  value,
  valueClassName,
  children,
}: {
  label: string
  aside?: ReactNode
  value: ReactNode
  valueClassName?: string
  children?: ReactNode
}) => (
  <div className="flex min-h-32 flex-col gap-2 rounded-xl bg-card p-4">
    <span className="flex min-h-6 items-center justify-between gap-2 text-sm font-medium">
      {label}
      {aside}
    </span>
    <span className={cn('text-xl font-semibold tabular-nums', valueClassName)}>{value}</span>
    {children && <div className="mt-auto flex flex-col gap-2 text-xs text-muted-foreground">{children}</div>}
  </div>
)

export const TreasurySummary = ({ summary, onSeeInvestments }: { summary: Summary; onSeeInvestments: () => void }) => (
  <div className="grid gap-3 @2xl:grid-cols-3" data-testid="treasury-summary">
    <StatCard
      label={COPY.invested}
      value={percent.format(summary.investedShare)}
      aside={
        <Button variant="ghost" size="xs" onClick={onSeeInvestments}>
          {COPY.seeAll}
          <ArrowRight />
        </Button>
      }
    >
      <Progress
        value={summary.investedShare * 100}
        aria-label="Share of treasury invested"
        indicatorClassName="bg-badge-dot-success"
      />
      <span className="tabular-nums">
        {COPY.investedOf(
          formatCompactUsd(summary.invested),
          formatCompactUsd(summary.total),
          formatCompactUsd(summary.idle),
        )}
      </span>
    </StatCard>
    <StatCard label={COPY.earned} value={`+${formatUsd(summary.earned)}`} valueClassName="text-badge-dot-success">
      <span>{COPY.earnedLead}</span>
    </StatCard>
    <StatCard label={COPY.apy} value={formatApy(summary.blendedApy)}>
      <span>{COPY.apyLead}</span>
    </StatCard>
  </div>
)
