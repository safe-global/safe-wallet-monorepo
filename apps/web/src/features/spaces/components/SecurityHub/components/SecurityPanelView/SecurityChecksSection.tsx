import { type ReactElement } from 'react'
import type { SafeGrade, ScanContext, ScanResult } from '@/features/security/types'
import SectionPanel from './SectionPanel'
import SafeGradeChip, { SAFE_GRADE_LABEL } from '../SafeGradeChip/SafeGradeChip'
import { useSecurityChecks } from './hooks/useSecurityChecks'

export type SecurityChecksSectionProps = {
  scanContext: ScanContext
  results: Record<string, ScanResult>
  safeQueryParam?: string
}

/** Severity order of the grade groups; the passing group is always rendered last. */
const GRADE_ORDER: SafeGrade[] = ['critical', 'at_risk', 'needs_attention', 'passing']

const SecurityChecksSection = ({
  scanContext,
  results,
  safeQueryParam,
}: SecurityChecksSectionProps): ReactElement | null => {
  const { isReady, failingRows, passingRows } = useSecurityChecks(scanContext, results, safeQueryParam)

  // Feature not yet loaded — render nothing; the panel skeleton covers this state.
  if (!isReady) return null

  // One group per grade present, each headed by its chip and followed by a card of its rows.
  const groups = GRADE_ORDER.map((grade) => ({
    grade,
    rows: grade === 'passing' ? passingRows : failingRows.filter((row) => row.grade === grade),
  })).filter((group) => group.rows.length > 0)

  return (
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
}

export default SecurityChecksSection
