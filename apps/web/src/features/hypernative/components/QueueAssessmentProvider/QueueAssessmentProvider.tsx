import { useMemo, type ReactElement, type ReactNode } from 'react'
import type { QueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import {
  QueueAssessmentProvider as ContextProvider,
  type QueueAssessmentContextValue,
} from '../../contexts/QueueAssessmentContext'
import { useQueueBatchAssessments } from '../../hooks/useQueueBatchAssessments'
import { useIsHypernativeGuard } from '../../hooks/useIsHypernativeGuard'

interface QueueAssessmentProviderProps {
  children: ReactNode
  pages: (QueuedItemPage | undefined)[]
}

/**
 * Provider component that fetches batch assessments for queue pages
 * and provides them through context to child components
 */
export const QueueAssessmentProvider = ({ children, pages }: QueueAssessmentProviderProps): ReactElement => {
  const { isHypernativeGuard, loading: hnGuardLoading } = useIsHypernativeGuard()

  // Fetch batch assessments for all pages
  const assessments = useQueueBatchAssessments({
    pages,
    skip: !isHypernativeGuard || hnGuardLoading,
  })

  // Determine if any assessment is currently loading
  const isLoading = useMemo(() => {
    return Object.values(assessments).some(([, , loading]) => loading)
  }, [assessments])

  const contextValue: QueueAssessmentContextValue = useMemo(
    () => ({
      assessments,
      isLoading,
    }),
    [assessments, isLoading],
  )

  return <ContextProvider value={contextValue}>{children}</ContextProvider>
}
