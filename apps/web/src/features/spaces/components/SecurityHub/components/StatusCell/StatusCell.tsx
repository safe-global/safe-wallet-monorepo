import { Skeleton, Typography } from '@mui/material'
import type { SafeGrade } from '@/features/security/types'
import SafeGradeChip from '../SafeGradeChip/SafeGradeChip'

const DASH = '—'

export type StatusCellProps = {
  grade: SafeGrade | null
  isScanning?: boolean
}

const StatusCell = ({ grade, isScanning }: StatusCellProps) => {
  if (!grade) {
    if (isScanning) return <Skeleton variant="rounded" width={70} height={20} />
    return (
      <Typography variant="body2" color="text.secondary">
        {DASH}
      </Typography>
    )
  }
  return <SafeGradeChip grade={grade} sx={{ height: 22 }} />
}

export default StatusCell
