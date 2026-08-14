import { type MouseEventHandler, type ReactElement } from 'react'
import type { VariantProps } from 'class-variance-authority'
import { Badge, type badgeVariants } from '@/components/ui/badge'
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
 * Badge variant per grade on the score ramp. `needs_attention` maps to the `review-*`
 * palette, which has no Badge variant — its pill tint is applied as a grandfathered
 * className below.
 */
const GRADE_BADGE_VARIANT: Record<SafeGrade, NonNullable<VariantProps<typeof badgeVariants>['variant']> | undefined> = {
  critical: 'negative',
  at_risk: 'warning',
  needs_attention: undefined,
  passing: 'positive',
}

/** Filled status dot in the grade's fill colour, sitting on the tinted pill. */
const GRADE_DOT_STYLES: Record<SafeGrade, string> = {
  critical: 'bg-[var(--color-error-main)]',
  at_risk: 'bg-[var(--color-warning-main)]',
  needs_attention: 'bg-[var(--color-review-main)]',
  passing: 'bg-[var(--color-success-main)]',
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
  return (
    <Badge
      variant={GRADE_BADGE_VARIANT[grade]}
      size="auto"
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={ariaLabel}
      className={cn(
        'gap-1.5',
        // eslint-disable-next-line no-restricted-syntax -- needs_attention maps to the review-* palette, which has no Badge variant
        grade === 'needs_attention' && 'bg-[var(--color-review-background)] text-[var(--color-review-main)]',
        onClick && 'cursor-pointer transition-opacity hover:opacity-80',
        active && 'ring-1 ring-inset ring-current',
        className,
      )}
    >
      <span className={cn('size-2 shrink-0 rounded-full', GRADE_DOT_STYLES[grade])} aria-hidden />
      {label ?? SAFE_GRADE_LABEL[grade]}
    </Badge>
  )
}

export default SafeGradeChip
