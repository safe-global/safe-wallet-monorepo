import type { SafeGrade } from '@/features/security/types'
import { StatusCellView } from '@views/features/spaces/components/SecurityHub/components/StatusCell/StatusCellView'

export type StatusCellProps = {
  grade: SafeGrade | null
  /** Total non-passing applicable checks. Ignored when grade is `passing` (chip reads "Healthy"). */
  count?: number
  isScanning?: boolean
}

const StatusCell = ({ grade, count, isScanning }: StatusCellProps) => {
  // A non-passing grade with count 0 means getSafeGrade and the count source disagree; the view shows Healthy.
  const safeCount = count ?? 0
  if (grade && grade !== 'passing' && safeCount === 0 && process.env.NODE_ENV !== 'production') {
    console.warn(
      `StatusCell: grade=${grade} but count=0 — getSafeGrade and the count source disagree. Falling back to Healthy.`,
    )
  }
  return <StatusCellView grade={grade} count={safeCount} isScanning={isScanning} />
}

export default StatusCell
