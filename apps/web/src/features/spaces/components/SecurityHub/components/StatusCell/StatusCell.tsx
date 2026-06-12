import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import type { SafeGrade } from '@/features/security/types'
import SafeGradeChip, { SAFE_GRADE_LABEL } from '../SafeGradeChip/SafeGradeChip'

const DASH = '—'

export type StatusCellProps = {
  grade: SafeGrade | null
  /** Number of checks behind the grade — rendered as e.g. "2 at risk". Omitted for a passing grade. */
  count?: number
  isScanning?: boolean
}

const StatusCell = ({ grade, count, isScanning }: StatusCellProps) => {
  if (!grade) {
    if (isScanning) return <Skeleton className="h-5 w-[70px] rounded-md" />
    return (
      <Typography variant="paragraph-small" color="muted">
        {DASH}
      </Typography>
    )
  }
  // e.g. "2 at risk", "1 needs review"; falls back to the plain grade label (e.g. "Healthy").
  const label = count ? `${count} ${SAFE_GRADE_LABEL[grade].toLowerCase()}` : undefined
  return <SafeGradeChip grade={grade} label={label} />
}

export default StatusCell
