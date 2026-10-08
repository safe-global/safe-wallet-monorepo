import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import type { SafeGrade } from '@/features/security/types'
import SafeGradeChip, {
  SAFE_GRADE_LABEL,
} from '@views/features/spaces/components/SecurityHub/components/SafeGradeChip/SafeGradeChip'

const DASH = '—'

export type StatusCellViewProps = {
  grade: SafeGrade | null
  /** Total non-passing applicable checks. Ignored when grade is `passing` (chip reads "Healthy"). */
  count: number
  isScanning?: boolean
}

const formatNonPassingLabel = (grade: SafeGrade, count: number): string =>
  `${SAFE_GRADE_LABEL[grade]} · ${count} issue${maybePlural(count)} found`

export const StatusCellView = ({ grade, count, isScanning }: StatusCellViewProps) => {
  if (!grade) {
    // Width chosen to comfortably fit the longest expected label ("Needs review · 99 issues found").
    if (isScanning) return <Skeleton className="h-5 w-40 rounded-md" />
    return (
      <Typography variant="paragraph-small" color="muted">
        {DASH}
      </Typography>
    )
  }
  // Passing Safes read as a bare "Healthy" chip — no count suffix. Other grades carry the
  // grade word in the label too so the chip reconciles with the panel header copy and the
  // sidebar per-group chips (all lead with the same "Grade · …" template).
  // A count of 0 always falls back to the Healthy chip so a desynced caller never shows "0 issues found".
  if (grade === 'passing' || count === 0) {
    return <SafeGradeChip grade="passing" ariaLabel={SAFE_GRADE_LABEL.passing} />
  }
  const label = formatNonPassingLabel(grade, count)
  return <SafeGradeChip grade={grade} label={label} ariaLabel={label} />
}
