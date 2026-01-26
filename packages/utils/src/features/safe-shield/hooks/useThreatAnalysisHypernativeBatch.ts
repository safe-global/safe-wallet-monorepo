import { useEffect, useMemo, useRef, useState } from 'react'
import type { ThreatAnalysisResults } from '../types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { mapHypernativeResponse } from '@safe-global/utils/features/safe-shield/utils/mapHypernativeResponse'
import { hypernativeApi } from '@safe-global/store/hypernative/hypernativeApi'
import { isHypernativeBatchAssessmentErrorResponse } from '@safe-global/store/hypernative/hypernativeApi.dto'
import { buildHypernativeBatchRequestData } from '../utils/buildHypernativeBatchRequestData'
import type { HypernativeBatchAssessmentRequestDto } from '@safe-global/store/hypernative/hypernativeApi.dto'

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
  const [request, setRequest] = useState<HypernativeBatchAssessmentRequestDto | undefined>(undefined)
  const prevRequestRef = useRef<HypernativeBatchAssessmentRequestDto | undefined>(undefined)
  const prevHashesRef = useRef<`0x${string}`[]>([])
  const [triggerBatchAssessment, { data: batchResponse, error, isLoading }] =
    hypernativeApi.useGetBatchAssessmentsMutation()

  // Build batch request only when hash values actually change
  useEffect(() => {
    const prevHashes = prevHashesRef.current

    const hashesEqual =
      prevHashes.length === safeTxHashes.length && prevHashes.every((hash) => safeTxHashes.includes(hash))

    if (hashesEqual) {
      return
    }

    // Hashes changed, update refs and build new request
    const newRequest = buildHypernativeBatchRequestData(safeTxHashes)

    if (newRequest) {
      setRequest(newRequest)
      prevHashesRef.current = safeTxHashes
      prevRequestRef.current = newRequest
    }
  }, [safeTxHashes])

  // Trigger batch assessment when request is ready
  useEffect(() => {
    if (!skip && request && authToken && request.safeTxHashes.length > 0) {
      triggerBatchAssessment({
        ...request,
        authToken,
      })
    }
  }, [request, authToken, triggerBatchAssessment, skip])

  // Process batch response into individual results
  const resultsMap = useMemo(() => {
    const results: Record<`0x${string}`, AsyncResult<ThreatAnalysisResults>> = {}
    if (skip || !request || !authToken) {
      return results
    }

    const requestedHashes = request?.safeTxHashes || []

    // Return early if no response, not loading, and no error
    if (!batchResponse && !isLoading && !error) {
      return results
    }

    // Initialize all requested hashes with loading state
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

        if (responseItem === undefined) {
          return
        }

        if (responseItem === null || responseItem.status === 'NOT_FOUND') {
          results[hash] = [undefined, new Error('Assessment result not found'), false]
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
    }

    return results
  }, [batchResponse, error, isLoading, skip, request, safeAddress, authToken])

  return resultsMap
}
