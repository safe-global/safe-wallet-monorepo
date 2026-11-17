import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { cn } from '@safe-global/views/utils/cn'
import { DEFI_V1_COPY, formatCompactUsd, formatUsd } from '../copy'
import type { IdleAsset, TreasurySummary as Summary } from '../shelf'

const COPY = DEFI_V1_COPY.summary
const RADIUS = 100 / (2 * Math.PI)
const GAP = 1
const MIN_SLICE = 1.5

type Part = { key: keyof typeof COPY.parts; value: number; className: string }

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
  action?: string
  onAction?: () => void
}) => (
  <div className="flex flex-col gap-1 rounded-xl bg-card px-4 py-3">
    <span className="flex min-h-6 items-center justify-between gap-2 text-sm font-medium">
      {title}
      {action && onAction && (
        <Button variant="ghost" size="xs" onClick={onAction}>
          {action}
          <ArrowRight />
        </Button>
      )}
    </span>
    <span className={cn('text-2xl font-semibold tabular-nums', statClassName)}>{stat}</span>
    <div className="mt-auto text-xs text-muted-foreground tabular-nums">{detail}</div>
  </div>
)

/** Tiny slices get a minimum arc so they stay visible; the legend carries the real values. */
const Donut = ({ parts, label }: { parts: Part[]; label: string }) => {
  const total = parts.reduce((sum, part) => sum + part.value, 0)
  const shown = parts.filter((part) => part.value > 0)
  const raw = shown.map((part) => Math.max((part.value / total) * 100, MIN_SLICE))
  const scale = 100 / raw.reduce((sum, value) => sum + value, 0)
  let offset = 25
  return (
    <svg viewBox="0 0 42 42" className="size-20 shrink-0" role="img" aria-label={label}>
      {shown.map((part, index) => {
        const length = raw[index] * scale
        const dash = shown.length > 1 ? Math.max(length - GAP, 0.5) : length
        const circle = (
          <circle
            key={part.key}
            cx="21"
            cy="21"
            r={RADIUS}
            fill="none"
            strokeWidth="5"
            stroke="currentColor"
            className={part.className}
            strokeDasharray={`${dash} ${100 - dash}`}
            strokeDashoffset={offset}
          >
            <title>{`${COPY.parts[part.key]} ${formatCompactUsd(part.value)}`}</title>
          </circle>
        )
        offset -= length
        return circle
      })}
    </svg>
  )
}

const AssetsChart = ({ summary }: { summary: Summary }) => {
  const parts: Part[] = [
    { key: 'idle', value: summary.idle, className: 'text-foreground/15' },
    { key: 'invested', value: summary.invested, className: 'text-badge-dot-success' },
    { key: 'earned', value: summary.earned, className: 'text-chart-3' },
  ]
  const total = parts.reduce((sum, part) => sum + part.value, 0)
  return (
    <div className="mt-1 flex items-center gap-4">
      <Donut
        parts={parts}
        label={COPY.chartLabel(
          formatCompactUsd(summary.idle),
          formatCompactUsd(summary.invested),
          formatCompactUsd(summary.earned),
        )}
      />
      <ul className="flex min-w-0 flex-1 flex-col gap-1">
        {parts.map((part) => (
          <li key={part.key} className="flex items-center gap-2">
            <span aria-hidden className={cn('size-2 shrink-0 rounded-full bg-current', part.className)} />
            <span className="text-muted-foreground">{COPY.parts[part.key]}</span>
            <span className="ml-auto text-foreground">{formatCompactUsd(part.value)}</span>
            <span className="w-9 text-right">{total > 0 ? `${Math.round((part.value / total) * 100)}%` : '—'}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

const IdleBreakdown = ({ assets }: { assets: IdleAsset[] }) => (
  <ul className="mt-1 flex flex-col gap-1" aria-label={COPY.idleBreakdown}>
    {assets.map(({ asset, amount }) => (
      <li key={asset} className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground">{asset}</span>
        <span className="text-foreground">{formatCompactUsd(amount)}</span>
      </li>
    ))}
  </ul>
)

export const TreasurySummary = ({
  summary,
  idleAssets,
  investmentCount,
  onInvestIdle,
  onSeeInvestments,
}: {
  summary: Summary
  idleAssets: IdleAsset[]
  investmentCount: number
  onInvestIdle?: () => void
  onSeeInvestments: () => void
}) => (
  <div className="grid gap-3 @2xl:grid-cols-3" data-testid="treasury-summary">
    <StatCard
      title={COPY.total}
      stat={formatCompactUsd(summary.idle + summary.invested + summary.earned)}
      detail={<AssetsChart summary={summary} />}
    />
    <StatCard
      title={COPY.idle}
      stat={formatCompactUsd(summary.idle)}
      detail={<IdleBreakdown assets={idleAssets} />}
      action={COPY.putIdleToWork}
      onAction={onInvestIdle}
    />
    <StatCard
      title={COPY.earned}
      stat={`+${formatUsd(summary.earned)}`}
      statClassName="text-badge-dot-success"
      detail={COPY.earnedFrom(investmentCount)}
      action={COPY.seeInvestments}
      onAction={onSeeInvestments}
    />
  </div>
)
