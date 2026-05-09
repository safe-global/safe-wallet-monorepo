import { useContext } from 'react'
import type { ThreatAnalysisResults } from '@safe-global/utils/features/safe-shield/types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { QueueAssessmentContext } from '../contexts/QueueAssessmentContext'

/**
 * Hook to get assessment data for a specific transaction hash
 * Uses the QueueAssessmentContext to retrieve assessment results
 *
 * @param safeTxHash - The safeTxHash of the transaction
 * @returns AsyncResult containing threat analysis results, or undefined if not available
 */
export function useHnQueueAssessmentResult(
  safeTxHash: string | undefined,
): AsyncResult<ThreatAnalysisResults> | undefined {
  const context = useContext(QueueAssessmentContext)

  if (!safeTxHash || !context) {
    return undefined
  }

  return context.assessments[safeTxHash as `0x${string}`]
}
