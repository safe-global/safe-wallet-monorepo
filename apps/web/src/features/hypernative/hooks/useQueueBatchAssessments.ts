import { useMemo } from 'react'
import type { QueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { ThreatAnalysisResults } from '@safe-global/utils/features/safe-shield/types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { useThreatAnalysisHypernativeBatch } from '@safe-global/utils/features/safe-shield/hooks/useThreatAnalysisHypernativeBatch'
import { getSafeTxHashFromTxId } from '@/utils/transactions'
import { isTransactionListItem } from '@/utils/transaction-guards'
import { useAuthToken } from './useAuthToken'
import useSafeInfo from '@/hooks/useSafeInfo'

type UseQueueBatchAssessmentsProps = {
  pages: (QueuedItemPage | undefined)[]
  skip?: boolean
}

/**
 * Hook for fetching batch Hypernative assessments for all transactions in the queue
 *
 * Extracts safeTxHashes from all loaded queue pages and fetches batch assessments.
 * Returns a map of safeTxHash to assessment results.
 *
 * @param pages - Array of queue pages (from pagination)
 * @param skip - Skip the analysis (useful when Hypernative Guard is not installed)
 * @returns Map of safeTxHash to AsyncResult containing threat analysis results
 */
export function useQueueBatchAssessments({
  pages,
  skip = false,
}: UseQueueBatchAssessmentsProps): Record<`0x${string}`, AsyncResult<ThreatAnalysisResults>> {
  const { safeAddress } = useSafeInfo()
  const [{ token: authToken }] = useAuthToken()

  // Extract all safeTxHashes from all queue pages
  const safeTxHashes = useMemo(() => {
    if (skip) {
      return []
    }

    const hashes: `0x${string}`[] = []

    for (const page of pages) {
      if (!page?.results) {
        continue
      }

      for (const item of page.results) {
        // Only process transaction items (skip labels, date labels, etc.)
        if (!isTransactionListItem(item)) {
          continue
        }

        // Extract safeTxHash from transaction ID
        const txId = item.transaction.id
        if (!txId) {
          continue
        }

        const safeTxHash = getSafeTxHashFromTxId(txId)
        if (!safeTxHash) {
          continue
        }

        // Avoid duplicates
        if (!hashes.includes(safeTxHash as `0x${string}`)) {
          hashes.push(safeTxHash as `0x${string}`)
        }
      }
    }

    return hashes
  }, [pages, skip])

  // Fetch batch assessments using the existing hook
  const assessments = useThreatAnalysisHypernativeBatch({
    safeTxHashes,
    safeAddress: safeAddress as `0x${string}`,
    authToken,
    skip: skip || safeTxHashes.length === 0,
  })

  return assessments
}
