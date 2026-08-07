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

/**
 * Per-grade chip styling on the score ramp: a soft tinted pill (`pill`) with the label in
 * the grade's readable text shade, plus a filled `dot` in the grade's fill colour. Critical
 * uses `error-main` (#FF5F72) — matching the red seen on per-check Critical rows — over
 * the soft `error-background` accent, so Critical labels read the same red everywhere in
 * the Security Hub.
 */
const GRADE_CHIP_STYLES: Record<SafeGrade, { pill: string; dot: string }> = {
  critical: {
    pill: 'bg-[var(--color-error-background)] text-[var(--color-error-main)]',
    dot: 'bg-[var(--color-error-main)]',
  },
  at_risk: {
    pill: 'bg-[var(--color-warning-background)] text-[var(--color-warning-main)]',
    dot: 'bg-[var(--color-warning-main)]',
  },
  needs_attention: {
    pill: 'bg-[var(--color-review-background)] text-[var(--color-review-main)]',
    dot: 'bg-[var(--color-review-main)]',
  },
  passing: {
    pill: 'bg-[var(--color-success-background)] text-[var(--color-success-main)]',
    dot: 'bg-[var(--color-success-main)]',
  },
}

export type SafeGradeChipProps = {
  /** Grade that drives the dot colour, pill tint and text colour. */
  grade: SafeGrade
  /** When true, render the active-filter ring around the pill. */
  active?: boolean
  /** Chip text — e.g. "3 critical". Defaults to the grade's label. */
  label?: string
  /** Accessible label — overrides the visible text for screen readers. */
  ariaLabel?: string
  onClick?: MouseEventHandler<HTMLSpanElement>
  className?: string
}

/**
 * Single visual primitive for SafeGrade chips: a soft tinted pill with a colored status dot
 * plus a label, both following the score ramp. Used as a static status indicator
 * (StatusCell) and as an interactive filter chip (WorkspaceHealthCard).
 */
const SafeGradeChip = ({
  grade,
  active = false,
  label,
  ariaLabel,
  onClick,
  className,
}: SafeGradeChipProps): ReactElement => {
  const styles = GRADE_CHIP_STYLES[grade]
  return (
    <Badge
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={ariaLabel}
      className={cn(
        'h-auto gap-1.5 rounded-full border-transparent px-2.5 py-1 text-xs font-medium',
        styles.pill,
        onClick && 'cursor-pointer transition-opacity hover:opacity-80',
        active && 'ring-1 ring-inset ring-current',
        className,
      )}
    >
      <span className={cn('size-2 shrink-0 rounded-full', styles.dot)} aria-hidden />
      {label ?? SAFE_GRADE_LABEL[grade]}
    </Badge>
  )
}

export default SafeGradeChip
