import { type MouseEventHandler, type ReactElement } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/utils/cn'
import type { SafeGrade } from '@/features/security/types'

/** Human-readable label per SafeGrade. Shared by every chip in the SecurityHub UI. */
export const SAFE_GRADE_LABEL: Record<SafeGrade, string> = {
  critical: 'Critical',
  at_risk: 'At risk',
  needs_attention: 'Needs review',
  passing: 'Healthy',
}

// Four ascending pill-shaped bars (a "signal strength" glyph) drawn on a 24×24 grid.
// Each bar sits on the same baseline (y=22) and grows upward; rx = width/2 gives fully
// rounded ends. Bars are evenly spaced 3px wide with 3px gaps.
const BARS: Array<{ x: number; height: number }> = [
  { x: 2, height: 4 },
  { x: 8, height: 8 },
  { x: 14, height: 12 },
  { x: 20, height: 16 },
]

const BAR_WIDTH = 3
const BASELINE = 22

// How many bars light up per grade — signal-strength metaphor: fewer lit bars = weaker.
// `critical` (worst) lights only the shortest bar; `passing` (best) lights all four.
const GRADE_BAR_LEVEL: Record<SafeGrade, number> = {
  critical: 1,
  at_risk: 2,
  needs_attention: 3,
  passing: 4,
}

// Fill color per grade for the lit bars, sourced from the theme CSS vars (vars.css).
const GRADE_BAR_FILL: Record<SafeGrade, string> = {
  critical: 'fill-[var(--color-error-dark)]',
  at_risk: 'fill-[var(--color-error-main)]',
  needs_attention: 'fill-[var(--color-warning-main)]',
  passing: 'fill-[var(--color-success-main)]',
}

// Styling applied when the chip is the active filter: soft grade background + accent ring/text.
const GRADE_ACTIVE_STYLES: Record<SafeGrade, string> = {
  critical: 'bg-[var(--color-error-background)] text-[var(--color-error-dark)] ring-[var(--color-error-dark)]',
  at_risk: 'bg-[var(--color-error-background)] text-[var(--color-error-main)] ring-[var(--color-error-main)]',
  needs_attention:
    'bg-[var(--color-warning-background)] text-[var(--color-warning-main)] ring-[var(--color-warning-main)]',
  passing: 'bg-[var(--color-success-background)] text-[var(--color-success-main)] ring-[var(--color-success-main)]',
}

const GradesGlyph = ({ grade }: { grade: SafeGrade }): ReactElement => {
  const litBars = GRADE_BAR_LEVEL[grade]

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={SAFE_GRADE_LABEL[grade]}
    >
      {BARS.map(({ x, height }, index) => (
        <rect
          key={x}
          x={x}
          y={BASELINE - height}
          width={BAR_WIDTH}
          height={height}
          rx={BAR_WIDTH / 2}
          className={index < litBars ? GRADE_BAR_FILL[grade] : 'fill-[var(--color-border-light)]'}
        />
      ))}
    </svg>
  )
}

export type SafeGradeChipProps = {
  /** Grade that drives the bar color and how many bars light up. */
  grade: SafeGrade
  /** When true, render the active-filter styling (soft grade background + accent ring). */
  active?: boolean
  /** Chip text — e.g. "1 critical". Defaults to the grade's label. */
  label?: string
  onClick?: MouseEventHandler<HTMLSpanElement>
  className?: string
}

/**
 * Single visual primitive for SafeGrade chips: a pill with a signal-strength bars glyph
 * (colored by grade) plus a label. Used both as a static status indicator (StatusCell)
 * and as an interactive filter chip (WorkspaceHealthCard).
 */
const SafeGradeChip = ({ grade, active = false, label, onClick, className }: SafeGradeChipProps): ReactElement => (
  <Badge
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    className={cn(
      'h-auto gap-2 rounded-full border-transparent bg-muted px-3 text-xs font-medium text-muted-foreground [&>svg]:size-[18px]!',
      onClick && 'cursor-pointer transition-opacity hover:opacity-80',
      active && cn('ring-1 ring-inset', GRADE_ACTIVE_STYLES[grade]),
      className,
    )}
  >
    <GradesGlyph grade={grade} />
    {label ?? SAFE_GRADE_LABEL[grade]}
  </Badge>
)

export default SafeGradeChip
