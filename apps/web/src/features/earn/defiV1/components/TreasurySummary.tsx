import { useState } from 'react'
import { cn } from '@safe-global/views/utils/cn'
import { DEFI_V1_COPY, formatCompactUsd, formatUsd } from '../copy'
import type { Slice, TreasurySummary as Summary } from '../shelf'

const COPY = DEFI_V1_COPY.summary
const RADIUS = 100 / (2 * Math.PI)
const GAP = 1
const MIN_SLICE = 1.5

const IDLE_SHADES = ['text-foreground/60', 'text-foreground/35', 'text-foreground/15']
const EARNED_SHADES = ['text-badge-dot-success', 'text-badge-dot-success/60', 'text-badge-dot-success/30']

type ChartSlice = Slice & { className: string }

const percent = (value: number, total: number) => (total > 0 ? `${Math.round((value / total) * 100)}%` : '—')

const shade = (slices: Slice[], shades: string[]): ChartSlice[] =>
  slices.map((slice, index) => ({ ...slice, className: shades[Math.min(index, shades.length - 1)] }))

/** Tiny slices get a minimum arc so they stay visible; the tooltip carries the real value. */
const Donut = ({
  slices,
  label,
  format,
}: {
  slices: ChartSlice[]
  label: string
  format: (value: number) => string
}) => {
  const [active, setActive] = useState<number | null>(null)
  const shown = slices.filter((slice) => slice.value > 0)
  const total = shown.reduce((sum, slice) => sum + slice.value, 0)
  const raw = shown.map((slice) => Math.max((slice.value / total) * 100, MIN_SLICE))
  const scale = 100 / raw.reduce((sum, value) => sum + value, 0)
  const current = active === null ? null : shown[active]
  let offset = 25

  return (
    <div className="relative shrink-0" onMouseLeave={() => setActive(null)}>
      <svg viewBox="0 0 42 42" className="size-24" role="img" aria-label={label}>
        {shown.length === 0 && (
          <circle cx="21" cy="21" r={RADIUS} fill="none" strokeWidth="6" stroke="currentColor" className="text-muted" />
        )}
        {shown.map((slice, index) => {
          const length = raw[index] * scale
          const dash = shown.length > 1 ? Math.max(length - GAP, 0.5) : length
          const circle = (
            <circle
              key={slice.label}
              cx="21"
              cy="21"
              r={RADIUS}
              fill="none"
              strokeWidth="6"
              stroke="currentColor"
              tabIndex={0}
              aria-label={`${slice.label} ${format(slice.value)}`}
              className={cn(
                'cursor-default outline-none transition-opacity',
                slice.className,
                active !== null && active !== index && 'opacity-40',
              )}
              strokeDasharray={`${dash} ${100 - dash}`}
              strokeDashoffset={offset}
              onMouseEnter={() => setActive(index)}
              onFocus={() => setActive(index)}
              onBlur={() => setActive(null)}
            />
          )
          offset -= length
          return circle
        })}
      </svg>
      {current && (
        <div
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-popover px-2.5 py-1.5 text-xs shadow-md ring-1 ring-border"
        >
          <span className="flex items-center gap-1.5">
            <span aria-hidden className={cn('size-2 rounded-full bg-current', current.className)} />
            <span className="font-medium">{current.label}</span>
          </span>
          <span className="tabular-nums text-muted-foreground">
            {format(current.value)} · {percent(current.value, total)}
          </span>
        </div>
      )}
    </div>
  )
}

const TOP_COUNT = 3

const TopList = ({ slices, format }: { slices: ChartSlice[]; format: (value: number) => string }) => (
  <ul className="mt-1 flex w-full flex-col gap-0.5 text-xs tabular-nums">
    {[...slices]
      .filter((slice) => slice.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, TOP_COUNT)
      .map((slice) => (
        <li key={slice.label} className="flex items-center gap-1.5">
          <span aria-hidden className={cn('size-2 shrink-0 rounded-full bg-current', slice.className)} />
          <span className="truncate text-muted-foreground">{slice.label}</span>
          <span className="ml-auto pl-2">{format(slice.value)}</span>
        </li>
      ))}
  </ul>
)

const StatCard = ({
  title,
  stat,
  statClassName,
  slices,
  chartLabel,
  format = formatCompactUsd,
}: {
  title: string
  stat: string
  statClassName?: string
  slices: ChartSlice[]
  chartLabel: string
  format?: (value: number) => string
}) => (
  <div className="flex items-center justify-between gap-4 rounded-xl bg-card px-4 py-3">
    <div className="flex min-w-0 max-w-56 flex-1 flex-col items-start gap-1">
      <span className="text-sm font-medium">{title}</span>
      <span className={cn('text-2xl font-semibold tabular-nums', statClassName)}>{stat}</span>
      <TopList slices={slices} format={format} />
    </div>
    <Donut slices={slices} label={chartLabel} format={format} />
  </div>
)

const describe = (title: string, slices: Slice[], format: (value: number) => string) =>
  `${title}: ${slices.map((slice) => `${slice.label} ${format(slice.value)}`).join(', ')}`

export const TreasurySummary = ({
  summary,
  idleAssets,
  earnedBy,
}: {
  summary: Summary
  idleAssets: Slice[]
  earnedBy: Slice[]
}) => {
  const totals: ChartSlice[] = [
    { label: COPY.parts.idle, value: summary.idle, className: 'text-foreground/15' },
    { label: COPY.parts.invested, value: summary.invested, className: 'text-badge-dot-success' },
    { label: COPY.parts.earned, value: summary.earned, className: 'text-chart-3' },
  ]
  return (
    <div className="grid gap-3 @2xl:grid-cols-3" data-testid="treasury-summary">
      <StatCard
        title={COPY.total}
        stat={formatCompactUsd(summary.idle + summary.invested + summary.earned)}
        slices={totals}
        chartLabel={describe(COPY.total, totals, formatCompactUsd)}
      />
      <StatCard
        title={COPY.idle}
        stat={formatCompactUsd(summary.idle)}
        slices={shade(idleAssets, IDLE_SHADES)}
        chartLabel={describe(COPY.idleBreakdown, idleAssets, formatCompactUsd)}
      />
      <StatCard
        title={COPY.earned}
        stat={`+${formatUsd(summary.earned)}`}
        statClassName="text-badge-dot-success"
        slices={shade(earnedBy, EARNED_SHADES)}
        chartLabel={describe(COPY.earnedBreakdown, earnedBy, formatUsd)}
        format={formatUsd}
      />
    </div>
  )
}
