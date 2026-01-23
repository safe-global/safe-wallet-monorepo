import { useEffect, useId, useCallback } from 'react'
import type { QueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import PaginatedTxns from './index'
import { useSetQueuePages } from '@/features/hypernative/hooks/useSetQueuePages'
import type useTxHistory from '@/hooks/useTxHistory'
import type useTxQueue from '@/hooks/useTxQueue'

interface PaginatedTxnsWithAssessmentProps {
  useTxns: typeof useTxHistory | typeof useTxQueue
}

/**
 * Wrapper component that connects PaginatedTxns to QueueAssessmentProvider
 * Automatically registers pages with the assessment provider when they change
 */
const PaginatedTxnsWithAssessment = ({ useTxns }: PaginatedTxnsWithAssessmentProps) => {
  const setPages = useSetQueuePages()
  const sourceId = useId()

  const handlePagesChange = useCallback(
    (pages: QueuedItemPage[]) => {
      if (setPages) {
        setPages(pages, sourceId)
      }
    },
    [setPages, sourceId],
  )

  useEffect(() => {
    return () => {
      if (setPages) {
        setPages([], sourceId)
      }
    }
  }, [setPages, sourceId])

  return <PaginatedTxns useTxns={useTxns} onPagesChange={handlePagesChange} />
}

export default PaginatedTxnsWithAssessment
