import { type MouseEventHandler, type ReactElement } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/utils/cn'
import type { SafeGrade } from '@/features/security/types'
import { GRADE_TONE, SeverityIcon } from '../SeverityIcon/SeverityIcon'

/** Human-readable label per SafeGrade. Shared by every chip in the SecurityHub UI. */
export const SAFE_GRADE_LABEL: Record<SafeGrade, string> = {
  critical: 'Critical',
  at_risk: 'At risk',
  needs_attention: 'Needs review',
  passing: 'Healthy',
}

// Styling applied when the chip is the active filter: soft grade background + accent ring/text.
const GRADE_ACTIVE_STYLES: Record<SafeGrade, string> = {
  critical: 'bg-[var(--color-error-background)] text-[var(--color-error-dark)] ring-[var(--color-error-dark)]',
  at_risk: 'bg-[var(--color-error-background)] text-[var(--color-error-main)] ring-[var(--color-error-main)]',
  needs_attention:
    'bg-[var(--color-warning-background)] text-[var(--color-warning-main)] ring-[var(--color-warning-main)]',
  passing: 'bg-[var(--color-success-background)] text-[var(--color-success-main)] ring-[var(--color-success-main)]',
}

export type SafeGradeChipProps = {
  /** Grade that drives the icon glyph and its color. */
  grade: SafeGrade
  /** When true, render the active-filter styling (soft grade background + accent ring). */
  active?: boolean
  /** Chip text — e.g. "1 critical". Defaults to the grade's label. */
  label?: string
  onClick?: MouseEventHandler<HTMLSpanElement>
  className?: string
}

/**
 * Single visual primitive for SafeGrade chips: a pill with the grade's severity icon
 * (the same glyph set the report drawer uses) plus a label. Used both as a static status
 * indicator (StatusCell) and as an interactive filter chip (WorkspaceHealthCard).
 */
const SafeGradeChip = ({ grade, active = false, label, onClick, className }: SafeGradeChipProps): ReactElement => (
  <Badge
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    className={cn(
      'h-auto  rounded-full border-transparent bg-muted px-3 text-xs font-medium text-muted-foreground [&>svg]:size-[18px]!',
      onClick && 'cursor-pointer transition-opacity hover:opacity-80',
      active && cn('ring-1 ring-inset', GRADE_ACTIVE_STYLES[grade]),
      className,
    )}
  >
    <SeverityIcon tone={GRADE_TONE[grade]} ariaLabel={SAFE_GRADE_LABEL[grade]} />
    {label ?? SAFE_GRADE_LABEL[grade]}
  </Badge>
)

export default SafeGradeChip
