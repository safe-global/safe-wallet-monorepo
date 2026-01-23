import { useMemo, useState, useCallback, useRef, type ReactElement, type ReactNode, useEffect } from 'react'
import type { QueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import {
  QueueAssessmentProvider as ContextProvider,
  type QueueAssessmentContextValue,
} from '../../contexts/QueueAssessmentContext'
import { useQueueBatchAssessments } from '../../hooks/useQueueBatchAssessments'
import { useIsHypernativeEligible } from '../../hooks/useIsHypernativeEligible'
import { useIsHypernativeQueueScanFeature } from '../../hooks/useIsHypernativeQueueScanFeature'
import { isSamePage } from '@/utils/tx-list'
import useSafeInfo from '@/hooks/useSafeInfo'

interface QueueAssessmentProviderProps {
  children: ReactNode
}

/**
 * Provider component that fetches batch assessments for queue pages
 * and provides them through context to child components
 */
export const QueueAssessmentProvider = ({ children }: QueueAssessmentProviderProps): ReactElement => {
  const { isHypernativeEligible, loading: hnEligibilityLoading } = useIsHypernativeEligible()
  const isHypernativeQueueScanEnabled = useIsHypernativeQueueScanFeature()
  const { safe, safeAddress } = useSafeInfo()

  const pagesSourcesRef = useRef<Map<string | symbol, QueuedItemPage[]>>(new Map())
  const [pages, setPages] = useState<QueuedItemPage[]>([])

  const skip = !isHypernativeQueueScanEnabled || !isHypernativeEligible || hnEligibilityLoading

  // Reset the pages when the Safe Account or chain changes
  useEffect(() => {
    pagesSourcesRef.current = new Map()
  }, [safe.chainId, safeAddress])

  const updatePages = useCallback(() => {
    const allPages: QueuedItemPage[] = []
    pagesSourcesRef.current.forEach((sourcePages) => {
      allPages.push(...sourcePages)
    })

    if (allPages.length !== pages.length || allPages.some((page, index) => !isSamePage(page, pages[index]))) {
      setPages(allPages)
    }
  }, [pages, skip])

  const setPagesCallback = useCallback(
    (newPages: QueuedItemPage[], sourceKey?: string | symbol) => {
      if (skip) {
        return
      }

      const key = sourceKey || Symbol('pages-source')
      pagesSourcesRef.current.set(key, newPages)
      updatePages()
    },
    [updatePages],
  )

  // Fetch batch assessments for all pages
  const assessments = useQueueBatchAssessments({
    pages,
    skip,
  })

  // Determine if any assessment is currently loading
  const isLoading = useMemo(() => {
    return Object.values(assessments).some(([, , loading]) => loading)
  }, [assessments])

  const contextValue: QueueAssessmentContextValue = useMemo(
    () => ({
      assessments,
      isLoading,
      setPages: setPagesCallback,
    }),
    [assessments, isLoading, setPagesCallback],
  )

  return <ContextProvider value={contextValue}>{children}</ContextProvider>
}
