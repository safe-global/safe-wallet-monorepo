import { useState } from 'react'
import { cn } from '@safe-global/views/utils/cn'
import { DEFI_V1_COPY, formatCompactUsd, formatUsd } from '../copy'
import type { Slice, TreasurySummary as Summary } from '../shelf'

const COPY = DEFI_V1_COPY.summary
const MIN_SEGMENT = 1.5
const TOP_COUNT = 3

const IDLE_SHADES = ['bg-foreground/50', 'bg-foreground/30', 'bg-foreground/15']
const DEPOSITED_SHADES = ['bg-badge-dot-success', 'bg-badge-dot-success/60', 'bg-badge-dot-success/30']
const EARNED_SHADES = ['bg-chart-3', 'bg-chart-3/60', 'bg-chart-3/30']

type Dot = Slice & { className: string }
type Part = Dot & { format: (value: number) => string; breakdown?: Dot[] }

const percent = (value: number, total: number) => (total > 0 ? `${Math.round((value / total) * 100)}%` : '—')

const shade = (slices: Slice[], shades: string[]): Dot[] =>
  [...slices]
    .filter((slice) => slice.value > 0)
    .sort((a, b) => b.value - a.value)
    .map((slice, index) => ({ ...slice, className: shades[Math.min(index, shades.length - 1)] }))

const Breakdown = ({ part }: { part: Part }) => (
  <div className="flex min-w-44 flex-col gap-1.5">
    <span className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-1.5 font-medium">
        <span aria-hidden className={cn('size-2 rounded-full', part.className)} />
        {part.label}
      </span>
      <span className="tabular-nums">{part.format(part.value)}</span>
    </span>
    {part.breakdown && part.breakdown.length > 0 && (
      <ul className="flex flex-col gap-0.5 border-t border-border pt-1.5 tabular-nums">
        {part.breakdown.slice(0, TOP_COUNT).map((item) => (
          <li key={item.label} className="flex items-center gap-1.5">
            <span aria-hidden className={cn('size-2 shrink-0 rounded-full', item.className)} />
            <span className="truncate text-muted-foreground">{item.label}</span>
            <span className="ml-auto pl-4">{part.format(item.value)}</span>
          </li>
        ))}
      </ul>
    )}
  </div>
)

/** Hovering a segment shows what it's made of. Tiny segments get a minimum width so they stay hoverable. */
const StackedBar = ({ parts, label }: { parts: Part[]; label: string }) => {
  const [active, setActive] = useState<number | null>(null)
  const shown = parts.filter((part) => part.value > 0)
  const total = shown.reduce((sum, part) => sum + part.value, 0)
  const grow = shown.map((part) => Math.max((part.value / total) * 100, MIN_SEGMENT))
  const growTotal = grow.reduce((sum, value) => sum + value, 0)
  const centerOf = (index: number) =>
    ((grow.slice(0, index).reduce((sum, value) => sum + value, 0) + grow[index] / 2) / growTotal) * 100
  const current = active === null ? null : shown[active]

  return (
    <div className="relative" onMouseLeave={() => setActive(null)}>
      <div role="img" aria-label={label} className="flex h-3 w-full gap-0.5 overflow-hidden rounded">
        {shown.length === 0 && <span className="flex-1 bg-muted" />}
        {shown.map((part, index) => (
          <span
            key={part.label}
            tabIndex={0}
            aria-label={`${part.label} ${part.format(part.value)}`}
            style={{ flexGrow: grow[index] }}
            className={cn(
              'basis-0 cursor-default outline-none transition-opacity first:rounded-l last:rounded-r focus-visible:ring-2 focus-visible:ring-ring',
              part.className,
              active !== null && active !== index && 'opacity-40',
            )}
            onMouseEnter={() => setActive(index)}
            onFocus={() => setActive(index)}
            onBlur={() => setActive(null)}
          />
        ))}
      </div>
      {current && active !== null && (
        <div
          role="tooltip"
          style={{ left: `clamp(6rem, ${centerOf(active)}%, calc(100% - 6rem))` }}
          className="pointer-events-none absolute bottom-full z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-popover px-3 py-2 text-xs shadow-md ring-1 ring-border"
          data-testid="summary-breakdown"
        >
          <Breakdown part={current} />
        </div>
      )}
    </div>
  )
}

const describe = (title: string, slices: Slice[], format: (value: number) => string) =>
  `${title}: ${slices.map((slice) => `${slice.label} ${format(slice.value)}`).join(', ')}`

const PartStat = ({ part, total }: { part: Part; total: number }) => (
  <div className="flex min-w-0 flex-col gap-0.5">
    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <span aria-hidden className={cn('size-2 shrink-0 rounded-full', part.className)} />
      {part.label}
      <span className="tabular-nums">· {percent(part.value, total)}</span>
    </span>
    <span className="text-lg font-semibold tabular-nums">{part.format(part.value)}</span>
  </div>
)

export const TreasurySummary = ({
  summary,
  idleAssets,
  depositedBy,
  earnedBy,
}: {
  summary: Summary
  idleAssets: Slice[]
  depositedBy: Slice[]
  earnedBy: Slice[]
}) => {
  const total = summary.idle + summary.invested + summary.earned
  const parts: Part[] = [
    {
      label: COPY.parts.idle,
      value: summary.idle,
      className: 'bg-foreground/25',
      format: formatCompactUsd,
      breakdown: shade(idleAssets, IDLE_SHADES),
    },
    {
      label: COPY.parts.invested,
      value: summary.invested,
      className: 'bg-badge-dot-success',
      format: formatCompactUsd,
      breakdown: shade(depositedBy, DEPOSITED_SHADES),
    },
    {
      label: COPY.parts.earned,
      value: summary.earned,
      className: 'bg-chart-3',
      format: formatUsd,
      breakdown: shade(earnedBy, EARNED_SHADES),
    },
  ]

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-card px-4 py-4" data-testid="treasury-summary">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{COPY.total}</span>
        <span className="text-2xl font-semibold tabular-nums">{formatCompactUsd(total)}</span>
      </div>
      <StackedBar parts={parts} label={describe(COPY.total, parts, formatCompactUsd)} />
      <div className="grid gap-4 @2xl:grid-cols-3 @2xl:gap-6">
        {parts.map((part) => (
          <PartStat key={part.label} part={part} total={total} />
        ))}
      </div>
    </div>
  )
}
