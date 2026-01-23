import { useContext } from 'react'
import { QueueAssessmentContext } from '../contexts/QueueAssessmentContext'
import type { QueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

/**
 * Hook to get the setPages function from QueueAssessmentContext
 * Allows child components to register their pages with the provider
 *
 * @returns setPages function or undefined if context is not available
 */
export function useSetQueuePages(): ((pages: QueuedItemPage[], sourceKey?: string | symbol) => void) | undefined {
  const context = useContext(QueueAssessmentContext)

  if (!context) {
    console.error('QueueAssessmentContext not found - please add QueueAssessmentProvider to the parent component')
    return undefined
  }

  return context.setPages
}
