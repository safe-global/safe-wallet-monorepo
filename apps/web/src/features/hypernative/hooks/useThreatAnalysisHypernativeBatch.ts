import { useMemo, useEffect, useRef } from 'react'
import type { QueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { ThreatAnalysisResults } from '@safe-global/utils/features/safe-shield/types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { useThreatAnalysisHypernativeBatch as useThreatAnalysisHypernativeBatchUtils } from '@safe-global/utils/features/safe-shield/hooks/useThreatAnalysisHypernativeBatch'
import { getSafeTxHashFromTxId } from '@/utils/transactions'
import { isTransactionQueuedItem } from '@/utils/transaction-guards'
import { useAuthToken } from './useAuthToken'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useAppSelector, useAppDispatch } from '@/store'
import { selectAssessmentsByHashes, setBatchAssessments } from '../store/hnQueueAssessmentsSlice'

type UseThreatAnalysisHypernativeBatchProps = {
  pages: (QueuedItemPage | undefined)[]
  skip?: boolean
}

/**
 * Context object for tracking the fetch operation
 * @property safeAddress - The Safe address
 * @property authToken - The authentication token
 */
type FetchContext = { safeAddress: string; authToken?: string }

/**
 * Extracts the Safe transaction hash from a queued item
 * @param item - The queued item
 * @returns The Safe transaction hash or null if not found
 */
const extractSafeTxHashFromItem = (item: QueuedItemPage['results'][number]): `0x${string}` | null => {
  if (!isTransactionQueuedItem(item)) return null

  const txId = item.transaction.id
  if (!txId) return null

  const safeTxHash = getSafeTxHashFromTxId(txId)
  return safeTxHash ? (safeTxHash as `0x${string}`) : null
}

/**
 * Extracts the Safe transaction hashes from a list of queued pages
 * @param pages - The list of queued pages
 * @returns The list of Safe transaction hashes
 */
const extractSafeTxHashesFromPages = (pages: (QueuedItemPage | undefined)[]): `0x${string}`[] => {
  const hashSet = new Set<`0x${string}`>()

  for (const page of pages) {
    const results = page?.results ?? []
    for (const item of results) {
      const hash = extractSafeTxHashFromItem(item)
      if (hash) hashSet.add(hash)
    }
  }

  return Array.from(hashSet)
}

/**
 * Collects the completed results from the fetched assessments
 * @param fetchedAssessments - The fetched assessments
 * @returns The collected results
 */
const collectCompletedResults = (
  fetchedAssessments: Record<string, AsyncResult<ThreatAnalysisResults>>,
): Record<`0x${string}`, ThreatAnalysisResults | null> => {
  const results: Record<`0x${string}`, ThreatAnalysisResults | null> = {}

  for (const [hash, result] of Object.entries(fetchedAssessments)) {
    const [data, error, loading] = result
    if (loading) continue

    if (error) {
      results[hash as `0x${string}`] = null
    } else if (data !== undefined) {
      results[hash as `0x${string}`] = data
    }
  }

  return results
}

/**
 * Converts a cached assessment to an AsyncResult
 * @param cached - The cached assessment
 * @returns The AsyncResult
 */
const cachedToAsyncResult = (
  cached: ThreatAnalysisResults | null | undefined,
): AsyncResult<ThreatAnalysisResults> | null => {
  if (cached === undefined) return null
  if (cached === null) return [undefined, new Error('Assessment failed'), false]
  return [cached, undefined, false]
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

  const safeTxHashes = useMemo(() => (skip ? [] : extractSafeTxHashesFromPages(pages)), [pages, skip])

  const cachedAssessments = useAppSelector((state) => selectAssessmentsByHashes(state, safeTxHashes))

  const hashesToFetch = useMemo(
    () => safeTxHashes.filter((hash) => cachedAssessments[hash] === undefined),
    [safeTxHashes, cachedAssessments],
  )

  const fetchedAssessments = useThreatAnalysisHypernativeBatchUtils({
    safeTxHashes: hashesToFetch,
    safeAddress: safeAddress as `0x${string}`,
    authToken,
    skip,
  })

  const fetchContextRef = useRef<FetchContext | null>(null)

  useEffect(() => {
    if (hashesToFetch.length > 0) {
      fetchContextRef.current = { safeAddress, authToken }
    }
  }, [hashesToFetch.length, safeAddress, authToken])

  useEffect(() => {
    const resultsToStore = collectCompletedResults(fetchedAssessments)
    if (Object.keys(resultsToStore).length === 0) return

    const fetchContext = fetchContextRef.current
    const contextMatches =
      fetchContext && fetchContext.safeAddress === safeAddress && fetchContext.authToken === authToken

    if (contextMatches) {
      dispatch(setBatchAssessments(resultsToStore))
    }
  }, [fetchedAssessments, dispatch, safeAddress, authToken])

  const assessments = useMemo(() => {
    const merged: Record<`0x${string}`, AsyncResult<ThreatAnalysisResults>> = {}

    for (const hash of safeTxHashes) {
      if (fetchedAssessments[hash]) {
        merged[hash] = fetchedAssessments[hash]
        continue
      }

      const cachedResult = cachedToAsyncResult(cachedAssessments[hash])
      if (cachedResult) {
        merged[hash] = cachedResult
      }
    }

    return merged
  }, [safeTxHashes, cachedAssessments, fetchedAssessments])

  return assessments
}
