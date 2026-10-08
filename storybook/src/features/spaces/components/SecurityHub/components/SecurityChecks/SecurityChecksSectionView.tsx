import type { ReactElement, ReactNode } from 'react'
import type { SafeGrade } from '@/features/security/types'
import SectionPanel from './SectionPanel'
import SafeGradeChip, {
  SAFE_GRADE_LABEL,
} from '@views/features/spaces/components/SecurityHub/components/SafeGradeChip/SafeGradeChip'

export type SecurityChecksSectionViewProps = {
  groups: { grade: SafeGrade; rows: { key: string; node: ReactNode }[] }[]
}

const SecurityChecksSectionView = ({ groups }: SecurityChecksSectionViewProps): ReactElement => (
  <div>
    {groups.map(({ grade, rows }, idx) => (
      <div key={grade}>
        <div className="mb-2">
          <SafeGradeChip grade={grade} label={`${SAFE_GRADE_LABEL[grade]} · ${rows.length}`} />
        </div>
        <SectionPanel rows={rows} baseDelay={0.08 + idx * 0.04} />
      </div>
    ))}
  </div>
)

export { SecurityChecksSectionView }
