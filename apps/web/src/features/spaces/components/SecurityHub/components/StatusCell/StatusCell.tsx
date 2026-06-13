import { Skeleton, Typography } from '@mui/material'
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
  `${SAFE_GRADE_LABEL[grade]} · ${count} issue${count === 1 ? '' : 's'} found`

const StatusCell = ({ grade, count, isScanning }: StatusCellProps) => {
  if (!grade) {
    // Width chosen to comfortably fit the longest expected label ("Needs review · 99 issues found").
    if (isScanning) return <Skeleton variant="rounded" width={160} height={20} />
    return (
      <Typography variant="body2" color="text.secondary">
        {DASH}
      </Typography>
    )
  }
  // Passing Safes read as a bare "Healthy" chip — no count suffix. Other grades carry the
  // grade word in the label too so the chip reconciles with the panel header copy and the
  // sidebar per-group chips (all lead with the same "Grade · …" template).
  // Defensive: if count is 0 the grade should always be `passing` (computeSummary and
  // getSafeGrade agree). Fall back to the Healthy chip so a desynced caller never produces
  // a nonsense "Needs review · 0 issues found" reading.
  const safeCount = count ?? 0
  if (grade === 'passing' || safeCount === 0) {
    return <SafeGradeChip grade="passing" ariaLabel={SAFE_GRADE_LABEL.passing} />
  }
  const label = formatNonPassingLabel(grade, safeCount)
  return <SafeGradeChip grade={grade} label={label} ariaLabel={label} />
}

export default StatusCell
