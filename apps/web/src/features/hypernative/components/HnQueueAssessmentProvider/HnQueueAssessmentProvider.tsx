import { useMemo, useState, useCallback, useRef, type ReactElement, type ReactNode, useEffect } from 'react'
import type { QueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import {
  QueueAssessmentProvider as ContextProvider,
  type QueueAssessmentContextValue,
} from '../../contexts/QueueAssessmentContext'
import { useThreatAnalysisHypernativeBatch } from '../../hooks/useThreatAnalysisHypernativeBatch'
import { isSamePage } from '@/utils/tx-list'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useAppDispatch } from '@/store'
import { clearAssessments } from '../../store/queueAssessmentsSlice'
import { useShowHypernativeAssessment } from '../../hooks/useShowHypernativeAssessment'

interface HnQueueAssessmentProviderProps {
  children: ReactNode
}

/**
 * Provider component that fetches batch assessments for queue pages
 * and provides them through context to child components
 */
export const HnQueueAssessmentProvider = ({ children }: HnQueueAssessmentProviderProps): ReactElement => {
  const { safe, safeAddress } = useSafeInfo()
  const dispatch = useAppDispatch()
  const pagesSourcesRef = useRef<Map<string | symbol, QueuedItemPage[]>>(new Map())
  const [pages, setPages] = useState<QueuedItemPage[]>([])
  const showAssessment = useShowHypernativeAssessment()

  // Reset the pages and clear assessments cache when the Safe Account or chain changes
  useEffect(() => {
    pagesSourcesRef.current = new Map()
    setPages([])
    dispatch(clearAssessments())
  }, [safe.chainId, safeAddress, dispatch])

  const updatePages = useCallback(() => {
    const allPages: QueuedItemPage[] = []
    pagesSourcesRef.current.forEach((sourcePages) => {
      allPages.push(...sourcePages)
    })

    if (allPages.length !== pages.length || allPages.some((page, index) => !isSamePage(page, pages[index]))) {
      setPages(allPages)
    }
  }, [pages])

  const setPagesCallback = useCallback(
    (newPages: QueuedItemPage[], sourceKey?: string | symbol) => {
      const key = sourceKey || Symbol('pages-source')
      pagesSourcesRef.current.set(key, newPages)
      updatePages()
    },
    [updatePages],
  )

  // Fetch batch assessments for all pages
  const assessments = useThreatAnalysisHypernativeBatch({
    pages,
    skip: !showAssessment,
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
