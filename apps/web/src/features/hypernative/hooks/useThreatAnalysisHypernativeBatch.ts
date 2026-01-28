import { useMemo, useEffect, useRef } from 'react'
import type { QueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { ThreatAnalysisResults } from '@safe-global/utils/features/safe-shield/types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { useThreatAnalysisHypernativeBatch as useThreatAnalysisHypernativeBatchUtils } from '@safe-global/utils/features/safe-shield/hooks/useThreatAnalysisHypernativeBatch'
import { getSafeTxHashFromTxId } from '@/utils/transactions'
import { isTransactionListItem } from '@/utils/transaction-guards'
import { useAuthToken } from './useAuthToken'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useAppSelector, useAppDispatch } from '@/store'
import { selectAssessmentsByHashes, setBatchAssessments } from '../store/hnQueueAssessmentsSlice'

type UseThreatAnalysisHypernativeBatchProps = {
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
export function useThreatAnalysisHypernativeBatch({
  pages,
  skip = false,
}: UseThreatAnalysisHypernativeBatchProps): Record<`0x${string}`, AsyncResult<ThreatAnalysisResults>> {
  const { safeAddress } = useSafeInfo()
  const [{ token: authToken }] = useAuthToken()
  const dispatch = useAppDispatch()

  // Extract all safeTxHashes from all queue pages
  const safeTxHashes = useMemo(() => {
    if (skip) {
      return []
    }

    const hashSet = new Set<`0x${string}`>()

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

        hashSet.add(safeTxHash as `0x${string}`)
      }
    }

    return Array.from(hashSet)
  }, [pages, skip])

  // Get cached assessments from Redux
  const cachedAssessments = useAppSelector((state) => selectAssessmentsByHashes(state, safeTxHashes))

  // Determine which hashes need to be fetched (not in cache)
  const hashesToFetch = useMemo(
    () => safeTxHashes.filter((hash) => cachedAssessments[hash] === undefined),
    [safeTxHashes, cachedAssessments],
  )

  // Fetch batch assessments for hashes not in cache
  const fetchedAssessments = useThreatAnalysisHypernativeBatchUtils({
    safeTxHashes: hashesToFetch,
    safeAddress: safeAddress as `0x${string}`,
    authToken,
    skip,
  })

  // Track the safeAddress and authToken used when fetch was initiated
  // This prevents storing results for the wrong Safe if user switches accounts during fetch
  const fetchContextRef = useRef<{ safeAddress: string; authToken?: string } | null>(null)

  // Update fetch context when a new fetch is initiated (hashesToFetch changes)
  useEffect(() => {
    if (hashesToFetch.length > 0) {
      fetchContextRef.current = { safeAddress, authToken }
    }
  }, [hashesToFetch.length, safeAddress, authToken])

  // Store fetched results in Redux when they become available
  useEffect(() => {
    const resultsToStore: Record<`0x${string}`, ThreatAnalysisResults | null> = {}

    Object.entries(fetchedAssessments).forEach(([hash, result]) => {
      const [data, error, loading] = result

      if (loading) {
        return
      }

      if (error) {
        resultsToStore[hash as `0x${string}`] = null
      }

      if (data !== undefined) {
        resultsToStore[hash as `0x${string}`] = data
      }
    })

    // Only store if safeAddress and authToken match the context when fetch was initiated
    // This prevents storing results for the wrong Safe if user switched accounts during fetch
    if (Object.keys(resultsToStore).length > 0) {
      const fetchContext = fetchContextRef.current
      if (fetchContext && fetchContext.safeAddress === safeAddress && fetchContext.authToken === authToken) {
        dispatch(setBatchAssessments(resultsToStore))
      }
    }
  }, [fetchedAssessments, dispatch, safeAddress, authToken])

  // Merge cached and fetched assessments
  const assessments = useMemo(() => {
    const merged: Record<`0x${string}`, AsyncResult<ThreatAnalysisResults>> = {}

    // Process all safeTxHashes to ensure they're represented in the result
    safeTxHashes.forEach((hash) => {
      // Fetched assessments take precedence over cached ones
      if (fetchedAssessments[hash]) {
        merged[hash] = fetchedAssessments[hash]
      } else if (Object.hasOwn(cachedAssessments, hash)) {
        // Use cached assessment (convert null error state back to AsyncResult)
        const cached = cachedAssessments[hash]
        if (cached === null) {
          merged[hash] = [undefined, new Error('Assessment failed'), false]
        } else {
          merged[hash] = [cached, undefined, false]
        }
      }
      // If hash is not cached and not fetched, it will be missing from merged
      // This is expected if fetching hasn't started yet
    })

    return merged
  }, [safeTxHashes, cachedAssessments, fetchedAssessments])

  return assessments
}
