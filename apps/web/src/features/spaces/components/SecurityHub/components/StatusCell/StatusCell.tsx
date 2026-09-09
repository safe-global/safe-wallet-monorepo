import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import type { SafeGrade } from '@/features/security/types'
import SafeGradeChip, { SAFE_GRADE_LABEL } from '../SafeGradeChip/SafeGradeChip'

const DASH = '—'

export type StatusCellProps = {
  grade: SafeGrade | null
  /** Total non-passing applicable checks. Ignored when grade is `passing` (chip reads "Healthy"). */
  count?: number
  isScanning?: boolean
}

const formatNonPassingLabel = (grade: SafeGrade, count: number): string =>
  `${SAFE_GRADE_LABEL[grade]} · ${count} issue${maybePlural(count)} found`

const StatusCell = ({ grade, count, isScanning }: StatusCellProps) => {
  if (!grade) {
    // Width chosen to comfortably fit the longest expected label ("Needs review · 99 issues found").
    if (isScanning) return <Skeleton className="h-5 w-40 rounded-md" />
    return (
      <Typography variant="paragraph-small" color="muted">
        {DASH}
      </Typography>
    )
  }
  // Passing Safes read as a bare "Healthy"; other grades carry the grade word to match the header/sidebar
  // ("Grade · …"). Defensive: count 0 should always be passing, so fall back to Healthy to avoid a desynced
  // "Needs review · 0 issues found" (and warn in dev).
  const safeCount = count ?? 0
  if (grade !== 'passing' && safeCount === 0 && process.env.NODE_ENV !== 'production') {
    console.warn(
      `StatusCell: grade=${grade} but count=0 — getSafeGrade and the count source disagree. Falling back to Healthy.`,
    )
  }
  if (grade === 'passing' || safeCount === 0) {
    return <SafeGradeChip grade="passing" ariaLabel={SAFE_GRADE_LABEL.passing} />
  }
  const label = formatNonPassingLabel(grade, safeCount)
  return <SafeGradeChip grade={grade} label={label} ariaLabel={label} />
}

export default StatusCell
