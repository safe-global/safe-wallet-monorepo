import { useContext } from 'react'
import { QueueAssessmentContext } from '../contexts/QueueAssessmentContext'
import type { QueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

/**
 * Hook to get the setPages function from QueueAssessmentContext
 * Allows child components to register their pages with the provider
 *
 * @returns setPages function
 * @throws Error if used outside HnQueueAssessmentProvider
 */
export function useSetQueuePages(): (pages: QueuedItemPage[], sourceKey?: string | symbol) => void {
  const context = useContext(QueueAssessmentContext)

  if (!context) {
    throw new Error('useSetQueuePages must be used within a HnQueueAssessmentProvider')
  }

  return context.setPages
}
