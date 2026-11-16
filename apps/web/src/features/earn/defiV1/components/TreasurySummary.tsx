import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Progress } from '@safe-global/views/components/ui/progress'
import { cn } from '@safe-global/views/utils/cn'
import { DEFI_V1_COPY, formatCompactUsd, formatUsd } from '../copy'
import type { TreasurySummary as Summary } from '../shelf'

const percent = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 0 })
const COPY = DEFI_V1_COPY.summary

const Stat = ({
  label,
  value,
  valueClassName,
  children,
}: {
  label: string
  value: ReactNode
  valueClassName?: string
  children: ReactNode
}) => (
  <div className="flex min-w-0 flex-col gap-1 px-4 py-3">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className={cn('text-lg font-semibold tabular-nums', valueClassName)}>{value}</span>
    <div className="flex flex-col gap-1.5 text-xs text-muted-foreground tabular-nums">{children}</div>
  </div>
)

export const TreasurySummary = ({ summary, onExploreIdle }: { summary: Summary; onExploreIdle: () => void }) => (
  <div
    className="grid divide-y divide-border rounded-xl bg-card @2xl:grid-cols-[1.4fr_1fr_1fr] @2xl:divide-x @2xl:divide-y-0"
    data-testid="treasury-summary"
  >
    <Stat label={COPY.invested} value={percent.format(summary.investedShare)}>
      <Progress
        value={summary.investedShare * 100}
        aria-label="Share of treasury invested"
        indicatorClassName="bg-badge-dot-success"
      />
      <span className="flex items-center justify-between gap-2">
        {COPY.investedOf(
          formatCompactUsd(summary.invested),
          formatCompactUsd(summary.total),
          formatCompactUsd(summary.idle),
        )}
        {summary.idle > 0 && (
          <Button variant="ghost" size="xs" onClick={onExploreIdle}>
            {COPY.putIdleToWork}
            <ArrowRight />
          </Button>
        )}
      </span>
    </Stat>
    <Stat label={COPY.earned} value={`+${formatUsd(summary.earned)}`} valueClassName="text-badge-dot-success">
      {COPY.earnedLead}
    </Stat>
    <Stat label={COPY.sameDay} value={formatCompactUsd(summary.sameDay)}>
      {COPY.sameDayOf(formatCompactUsd(summary.sameDay), formatCompactUsd(summary.invested))}
    </Stat>
  </div>
)
