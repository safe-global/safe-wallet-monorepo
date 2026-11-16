import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Progress } from '@safe-global/views/components/ui/progress'
import { cn } from '@safe-global/views/utils/cn'
import { DEFI_V1_COPY, formatCompactUsd, formatUsd } from '../copy'
import type { TreasurySummary as Summary } from '../shelf'

const COPY = DEFI_V1_COPY.summary

const StatCard = ({
  title,
  stat,
  statClassName,
  detail,
  action,
  onAction,
}: {
  title: string
  stat: ReactNode
  statClassName?: string
  detail: ReactNode
  action: string
  onAction: () => void
}) => (
  <div className="flex flex-col gap-1 rounded-xl bg-card px-4 py-3">
    <span className="flex min-h-6 items-center justify-between gap-2 text-sm font-medium">
      {title}
      <Button variant="ghost" size="xs" onClick={onAction}>
        {action}
        <ArrowRight />
      </Button>
    </span>
    <span className={cn('text-2xl font-semibold tabular-nums', statClassName)}>{stat}</span>
    <div className="mt-auto text-xs text-muted-foreground tabular-nums">{detail}</div>
  </div>
)

export const TreasurySummary = ({
  summary,
  investmentCount,
  onExploreIdle,
  onSeeInvestments,
  onGroupByLiquidity,
}: {
  summary: Summary
  investmentCount: number
  onExploreIdle: () => void
  onSeeInvestments: () => void
  onGroupByLiquidity: () => void
}) => (
  <div className="grid gap-3 @2xl:grid-cols-3" data-testid="treasury-summary">
    <StatCard
      title={COPY.idle}
      stat={formatCompactUsd(summary.idle)}
      detail={
        <Progress
          value={summary.investedShare * 100}
          aria-label="Share of treasury invested"
          indicatorClassName="bg-badge-dot-success"
          className="mt-2"
        />
      }
      action={COPY.putIdleToWork}
      onAction={onExploreIdle}
    />
    <StatCard
      title={COPY.earned}
      stat={`+${formatUsd(summary.earned)}`}
      statClassName="text-badge-dot-success"
      detail={COPY.earnedFrom(investmentCount)}
      action={COPY.seeInvestments}
      onAction={onSeeInvestments}
    />
    <StatCard
      title={COPY.sameDay}
      stat={formatCompactUsd(summary.sameDay)}
      detail={COPY.sameDayOf(formatCompactUsd(summary.invested))}
      action={COPY.byLiquidity}
      onAction={onGroupByLiquidity}
    />
  </div>
)
