import type { ReactNode } from 'react'
import { Card, CardContent } from '@safe-global/views/components/ui/card'
import { Progress } from '@safe-global/views/components/ui/progress'
import { Separator } from '@safe-global/views/components/ui/separator'
import { formatApy, formatCompactUsd, formatUsd } from '../copy'
import type { TreasurySummary as Summary } from '../shelf'

const percent = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 0 })

export const TreasurySummary = ({ summary, footer }: { summary: Summary; footer?: ReactNode }) => (
  <Card size="sm" className="w-full md:w-[400px]" data-testid="treasury-summary">
    <CardContent>
      <div className="flex flex-col gap-3 text-sm">
        <div className="flex items-baseline justify-between gap-3">
          <span>
            <span className="font-semibold">{percent.format(summary.investedShare)}</span> of treasury invested
          </span>
          <span className="tabular-nums text-muted-foreground">
            {formatCompactUsd(summary.invested)} of {formatCompactUsd(summary.total)}
          </span>
        </div>
        <Progress
          value={summary.investedShare * 100}
          aria-label="Share of treasury invested"
          indicatorClassName="bg-badge-dot-success"
        />
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-badge-dot-success" aria-hidden />
            Invested {formatCompactUsd(summary.invested)}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-muted-foreground/30" aria-hidden />
            Idle {formatCompactUsd(summary.idle)}
          </span>
        </div>
        <Separator />
        <div className="flex items-center justify-between gap-3">
          <span>
            <span className="font-semibold text-badge-dot-success">+{formatUsd(summary.earned)}</span>{' '}
            <span className="text-muted-foreground">earned YTD</span>
          </span>
          <span>
            <span className="font-semibold tabular-nums">{formatApy(summary.blendedApy)}</span>{' '}
            <span className="text-muted-foreground">blended APY</span>
          </span>
        </div>
        {footer && (
          <>
            <Separator />
            {footer}
          </>
        )}
      </div>
    </CardContent>
  </Card>
)
