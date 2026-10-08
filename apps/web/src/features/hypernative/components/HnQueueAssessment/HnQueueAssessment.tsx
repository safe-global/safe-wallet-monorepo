import { type ReactElement } from 'react'
import type { ThreatAnalysisResults } from '@safe-global/utils/features/safe-shield/types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { useAssessmentUrl } from '../../hooks/useAssessmentUrl'
import { useHnAssessmentSeverity } from '../../hooks/useHnAssessmentSeverity'
import { HnQueueAssessmentView } from '@views/features/hypernative/components/HnQueueAssessment/HnQueueAssessmentView'

interface HnQueueAssessmentProps {
  safeTxHash: string
  assessment: AsyncResult<ThreatAnalysisResults> | undefined
  isAuthenticated: boolean
}

export const HnQueueAssessment = ({
  safeTxHash,
  assessment,
  isAuthenticated,
}: HnQueueAssessmentProps): ReactElement | null => {
  const severity = useHnAssessmentSeverity(assessment)
  const assessmentUrl = useAssessmentUrl(safeTxHash)

  return (
    <HnQueueAssessmentView
      assessment={assessment}
      isAuthenticated={isAuthenticated}
      severity={severity}
      assessmentUrl={assessmentUrl}
    />
  )
}
