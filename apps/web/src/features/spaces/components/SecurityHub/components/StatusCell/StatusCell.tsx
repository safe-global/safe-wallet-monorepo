import { Chip, Skeleton, Typography } from '@mui/material'
import type { SafeGrade } from '@/features/security/types'

const DASH = '—'

const STATUS_LABELS: Record<SafeGrade, string> = {
  critical: 'Critical',
  at_risk: 'At risk',
  needs_attention: 'Needs review',
  passing: 'Healthy',
}

const STATUS_PALETTE: Record<SafeGrade, { bg: string; text: string }> = {
  critical: { bg: 'error.background', text: 'error.dark' },
  at_risk: { bg: 'error.background', text: 'error.main' },
  needs_attention: { bg: 'warning.background', text: 'warning.main' },
  passing: { bg: 'success.background', text: 'success.main' },
}

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
  const { bg, text } = STATUS_PALETTE[grade]
  return (
    <Chip
      label={STATUS_LABELS[grade]}
      size="small"
      sx={{
        backgroundColor: bg,
        color: text,
        fontWeight: 700,
        height: 22,
        '& .MuiChip-label': { px: 1 },
      }}
    />
  )
}

export default StatusCell
