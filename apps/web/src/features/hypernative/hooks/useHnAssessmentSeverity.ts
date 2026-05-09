import { useEffect, useMemo, useState } from 'react'
import type { ThreatAnalysisResults } from '@safe-global/utils/features/safe-shield/types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { getPrimaryAnalysisResult } from '@safe-global/utils/features/safe-shield/utils/getPrimaryAnalysisResult'
import { Severity } from '@safe-global/utils/features/safe-shield/types'

/**
 * Hook to extract and manage severity from Hypernative assessment results
 * @param assessment - The assessment result from threat analysis
 * @returns The severity level from the assessment, or ERROR if there's an error
 */
export const useHnAssessmentSeverity = (
  assessment: AsyncResult<ThreatAnalysisResults> | undefined,
): Severity | undefined => {
  const [assessmentData, error] = assessment || [undefined, undefined]

  // Extract primary result and severity
  const primaryResult = useMemo(() => {
    if (!assessmentData) {
      return undefined
    }
    const groupedAssessmentData = {
      ['0x']: {
        THREAT: assessmentData.THREAT,
        CUSTOM_CHECKS: assessmentData.CUSTOM_CHECKS,
      },
    }
    return getPrimaryAnalysisResult(groupedAssessmentData)
  }, [assessmentData])

  const [severity, setSeverity] = useState<Severity | undefined>(primaryResult?.severity)

  useEffect(() => {
    setSeverity(error ? Severity.ERROR : primaryResult?.severity)
  }, [error, primaryResult?.severity])

  return severity
}
