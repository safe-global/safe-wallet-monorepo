import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { cn } from '@safe-global/views/utils/cn'
import { DEFI_V1_COPY, formatCompactUsd, formatUsd } from '../copy'
import type { TreasurySummary as Summary } from '../shelf'

const percent = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 0 })
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
  <div className="flex flex-col gap-1 rounded-xl bg-card px-4 pt-3 pb-2">
    <span className="text-sm font-medium">{title}</span>
    <span className={cn('text-2xl font-semibold tabular-nums', statClassName)}>{stat}</span>
    <span className="text-xs text-muted-foreground tabular-nums">{detail}</span>
    <Button variant="ghost" size="xs" className="mt-2 -ml-2 self-start" onClick={onAction}>
      {action}
      <ArrowRight />
    </Button>
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
      detail={COPY.idleOf(percent.format(1 - summary.investedShare), formatCompactUsd(summary.total))}
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
