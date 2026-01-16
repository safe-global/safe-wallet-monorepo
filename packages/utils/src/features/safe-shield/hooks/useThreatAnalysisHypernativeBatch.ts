import { useEffect, useMemo, useRef } from 'react'
import type { ThreatAnalysisResults } from '../types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { mapHypernativeResponse } from '@safe-global/utils/features/safe-shield/utils/mapHypernativeResponse'
import { hypernativeApi } from '@safe-global/store/hypernative/hypernativeApi'
import { isHypernativeBatchAssessmentErrorResponse } from '@safe-global/store/hypernative/hypernativeApi.dto'
import { buildHypernativeBatchRequestData } from '../utils/buildHypernativeBatchRequestData'

type UseThreatAnalysisHypernativeBatchProps = {
  safeTxHashes: `0x${string}`[]
  safeAddress: `0x${string}`
  authToken?: string
  skip?: boolean
}

/**
 * Hook for fetching batch threat analysis data from Hypernative API
 * Retrieves existing assessment results for multiple transaction hashes in a single API call
 * Requires an OAuth bearer token for authentication
 *
 * @param safeTxHashes - Transaction hashes
 * @param safeAddress - Safe contract address
 * @param authToken - OAuth bearer token from Hypernative authentication
 * @param skip - Skip the analysis (useful when Hypernative Guard is not installed)
 * @returns Map of safeTxHash to AsyncResult containing threat analysis results with loading and error states
 */
export function useThreatAnalysisHypernativeBatch({
  safeTxHashes,
  safeAddress,
  authToken,
  skip = false,
}: UseThreatAnalysisHypernativeBatchProps): Record<`0x${string}`, AsyncResult<ThreatAnalysisResults>> {
  const prevHashesRef = useRef<`0x${string}`[]>([])
  const prevRequestRef = useRef<{ safeTxHashes: `0x${string}`[] } | undefined>(undefined)
  const [triggerBatchAssessment, { data: batchResponse, error, isLoading }] =
    hypernativeApi.useGetBatchAssessmentsMutation()

  // Build batch request only when hash values actually change
  const batchRequest = useMemo(() => {
    if (skip) {
      prevHashesRef.current = []
      prevRequestRef.current = undefined
      return undefined
    }

    // Compare hash values, not array reference
    // Simple array comparison for primitive arrays (more efficient than lodash.isEqual)
    const prevHashes = prevHashesRef.current
    const hashesEqual =
      prevHashes.length === safeTxHashes.length && prevHashes.every((hash) => safeTxHashes.includes(hash))

    if (hashesEqual) {
      // Hashes haven't changed, return previous request
      return prevRequestRef.current
    }

    // Hashes changed, update refs and build new request
    prevHashesRef.current = safeTxHashes
    const newRequest = buildHypernativeBatchRequestData(safeTxHashes)
    prevRequestRef.current = newRequest
    return newRequest
  }, [safeTxHashes, skip])

  // Trigger batch assessment when request is ready
  useEffect(() => {
    if (!skip && batchRequest && authToken && batchRequest.safeTxHashes.length > 0) {
      triggerBatchAssessment({
        ...batchRequest,
        authToken,
      })
    }
  }, [batchRequest, authToken, triggerBatchAssessment, skip])

  // Process batch response into individual results
  const resultsMap = useMemo(() => {
    const results: Record<`0x${string}`, AsyncResult<ThreatAnalysisResults>> = {}

    if (skip) {
      return results
    }

    // Handle missing authToken case
    if (!authToken) {
      const requestedHashes = batchRequest?.safeTxHashes || []
      requestedHashes.forEach((hash) => {
        results[hash] = [undefined, new Error('authToken is required'), false]
      })
      return results
    }

    // Initialize all requested hashes with loading state
    const requestedHashes = batchRequest?.safeTxHashes || []
    requestedHashes.forEach((hash) => {
      results[hash] = [undefined, undefined, true]
    })

    // Handle batch-level errors
    if (error) {
      const errorMessage = isHypernativeBatchAssessmentErrorResponse(error)
        ? error.error.message
        : 'Failed to fetch Hypernative batch threat analysis'

      requestedHashes.forEach((hash) => {
        results[hash] = [undefined, new Error(errorMessage), false]
      })

      return results
    }

    // Process successful batch response
    if (batchResponse) {
      // Map each requested hash to its result
      requestedHashes.forEach((hash) => {
        const responseItem = batchResponse.find((item) => item.safeTxHash === hash)

        if (!responseItem) {
          // Hash not found in response (shouldn't happen per API spec, but handle gracefully)
          results[hash] = [undefined, new Error('Assessment result not found'), false]
          return
        }

        if (responseItem.status === 'NOT_FOUND') {
          // Assessment not found for this transaction
          results[hash] = [undefined, undefined, false]
          return
        }

        if (responseItem.status === 'OK' && responseItem.assessmentData) {
          // Map successful assessment using existing mapper
          try {
            const threatAnalysisResult = mapHypernativeResponse(
              {
                safeTxHash: responseItem.safeTxHash,
                status: 'OK',
                assessmentData: responseItem.assessmentData,
              },
              safeAddress,
            )
            results[hash] = [threatAnalysisResult, undefined, false]
          } catch (mappingError) {
            results[hash] = [
              undefined,
              mappingError instanceof Error ? mappingError : new Error('Failed to map assessment result'),
              false,
            ]
          }
        } else {
          // Unexpected status
          results[hash] = [undefined, new Error(`Unexpected status: ${responseItem.status}`), false]
        }
      })
    } else if (!isLoading) {
      // No response and not loading - all results are undefined
      requestedHashes.forEach((hash) => {
        results[hash] = [undefined, undefined, false]
      })
    }

    return results
  }, [batchResponse, error, isLoading, skip, batchRequest, safeAddress, authToken])

  return resultsMap
}
