import { useState } from 'react'
import { cn } from '@safe-global/views/utils/cn'
import { DEFI_V1_COPY, formatCompactUsd, formatUsd } from '../copy'
import type { Slice, TreasurySummary as Summary } from '../shelf'

const COPY = DEFI_V1_COPY.summary
const MIN_SEGMENT = 1.5
const TOP_COUNT = 3

const IDLE_SHADES = ['bg-foreground/50', 'bg-foreground/30', 'bg-foreground/15']
const EARNED_SHADES = ['bg-chart-3', 'bg-chart-3/60', 'bg-chart-3/30']

type Segment = Slice & { className: string }

const percent = (value: number, total: number) => (total > 0 ? `${Math.round((value / total) * 100)}%` : '—')

const shade = (slices: Slice[], shades: string[]): Segment[] =>
  [...slices]
    .filter((slice) => slice.value > 0)
    .sort((a, b) => b.value - a.value)
    .map((slice, index) => ({ ...slice, className: shades[Math.min(index, shades.length - 1)] }))

/** Tiny segments get a minimum width so they stay visible; the tooltip carries the real value. */
const StackedBar = ({
  segments,
  label,
  format,
  size = 'lg',
}: {
  segments: Segment[]
  label: string
  format: (value: number) => string
  size?: 'lg' | 'sm'
}) => {
  const [active, setActive] = useState<number | null>(null)
  const shown = segments.filter((segment) => segment.value > 0)
  const total = shown.reduce((sum, segment) => sum + segment.value, 0)
  const current = active === null ? null : shown[active]

  return (
    <div className="relative" onMouseLeave={() => setActive(null)}>
      <div
        role="img"
        aria-label={label}
        className={cn('flex w-full gap-0.5 overflow-hidden rounded', size === 'lg' ? 'h-3' : 'h-1.5')}
      >
        {shown.length === 0 && <span className="flex-1 bg-muted" />}
        {shown.map((segment, index) => (
          <span
            key={segment.label}
            tabIndex={0}
            aria-label={`${segment.label} ${format(segment.value)}`}
            style={{ flexGrow: Math.max((segment.value / total) * 100, MIN_SEGMENT) }}
            className={cn(
              'basis-0 cursor-default outline-none transition-opacity first:rounded-l last:rounded-r focus-visible:ring-2 focus-visible:ring-ring',
              segment.className,
              active !== null && active !== index && 'opacity-40',
            )}
            onMouseEnter={() => setActive(index)}
            onFocus={() => setActive(index)}
            onBlur={() => setActive(null)}
          />
        ))}
      </div>
      {current && (
        <div
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-popover px-2.5 py-1.5 text-xs shadow-md ring-1 ring-border"
        >
          <span className="flex items-center gap-1.5">
            <span aria-hidden className={cn('size-2 rounded-full', current.className)} />
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

const TopList = ({ segments, format }: { segments: Segment[]; format: (value: number) => string }) => (
  <ul className="flex w-full flex-col gap-0.5 text-xs tabular-nums">
    {segments.slice(0, TOP_COUNT).map((segment) => (
      <li key={segment.label} className="flex items-center gap-1.5">
        <span aria-hidden className={cn('size-2 shrink-0 rounded-full', segment.className)} />
        <span className="truncate text-muted-foreground">{segment.label}</span>
        <span className="ml-auto pl-2">{format(segment.value)}</span>
      </li>
    ))}
  </ul>
)

const describe = (title: string, slices: Slice[], format: (value: number) => string) =>
  `${title}: ${slices.map((slice) => `${slice.label} ${format(slice.value)}`).join(', ')}`

const Part = ({
  part,
  total,
  breakdown,
  breakdownLabel,
  format = formatCompactUsd,
}: {
  part: Segment
  total: number
  breakdown?: Segment[]
  breakdownLabel?: string
  format?: (value: number) => string
}) => (
  <div className="flex min-w-0 flex-col gap-2">
    <div className="flex flex-col gap-0.5">
      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <span aria-hidden className={cn('size-2 shrink-0 rounded-full', part.className)} />
        {part.label}
        <span className="tabular-nums">· {percent(part.value, total)}</span>
      </span>
      <span className="text-lg font-semibold tabular-nums">{format(part.value)}</span>
    </div>
    {breakdown && breakdown.length > 0 && breakdownLabel && (
      <>
        <StackedBar
          segments={breakdown}
          size="sm"
          label={describe(breakdownLabel, breakdown, format)}
          format={format}
        />
        <TopList segments={breakdown} format={format} />
      </>
    )}
  </div>
)

export const TreasurySummary = ({
  summary,
  idleAssets,
  earnedBy,
}: {
  summary: Summary
  idleAssets: Slice[]
  earnedBy: Slice[]
}) => {
  const total = summary.idle + summary.invested + summary.earned
  const [idle, invested, earned]: Segment[] = [
    { label: COPY.parts.idle, value: summary.idle, className: 'bg-foreground/25' },
    { label: COPY.parts.invested, value: summary.invested, className: 'bg-badge-dot-success' },
    { label: COPY.parts.earned, value: summary.earned, className: 'bg-chart-3' },
  ]
  const parts = [idle, invested, earned]

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-card px-4 py-4" data-testid="treasury-summary">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{COPY.total}</span>
        <span className="text-2xl font-semibold tabular-nums">{formatCompactUsd(total)}</span>
      </div>
      <StackedBar segments={parts} label={describe(COPY.total, parts, formatCompactUsd)} format={formatCompactUsd} />
      <div className="grid gap-4 @2xl:grid-cols-3 @2xl:gap-6">
        <Part
          part={idle}
          total={total}
          breakdown={shade(idleAssets, IDLE_SHADES)}
          breakdownLabel={COPY.idleBreakdown}
        />
        <Part part={invested} total={total} />
        <Part
          part={earned}
          total={total}
          breakdown={shade(earnedBy, EARNED_SHADES)}
          breakdownLabel={COPY.earnedBreakdown}
          format={formatUsd}
        />
      </div>
    </div>
  )
}
