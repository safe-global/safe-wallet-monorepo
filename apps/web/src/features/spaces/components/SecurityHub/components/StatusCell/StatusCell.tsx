import { Skeleton, Typography } from '@mui/material'
import type { SafeGrade } from '@/features/security/types'
import { GRADE_RAMP } from '../../scoreBands'

const DASH = '—'

/**
 * Status language per grade. A dense table column of filled pills reads as a wall
 * of color, so the table uses a quiet dot + label instead: color-coded but calm.
 * Colors come from the shared score ramp (`GRADE_RAMP`) — the vivid color for the
 * dot, the darker text variant for the readable label.
 */
const GRADE_LABEL: Record<SafeGrade, string> = {
  critical: 'Critical',
  at_risk: 'At risk',
  needs_attention: 'Needs review',
  passing: 'Healthy',
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
  const { color, textColor } = GRADE_RAMP[grade]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} aria-hidden />
      <span style={{ color: textColor, fontSize: '0.8125rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
        {GRADE_LABEL[grade]}
      </span>
    </span>
  )
}

export default StatusCell
