import { useContext } from 'react'
import { QueueAssessmentContext, type QueueAssessmentContextValue } from '../contexts/QueueAssessmentContext'

/**
 * Hook to access the QueueAssessmentContext
 * Provides access to assessments, loading state, and setPages function
 *
 * @returns QueueAssessmentContextValue
 * @throws Error if used outside HnQueueAssessmentProvider
 */
export function useHnQueueAssessment(): QueueAssessmentContextValue {
  const context = useContext(QueueAssessmentContext)

  if (!context) {
    throw new Error('useHnQueueAssessment must be used within a HnQueueAssessmentProvider')
  }

  return context
}
