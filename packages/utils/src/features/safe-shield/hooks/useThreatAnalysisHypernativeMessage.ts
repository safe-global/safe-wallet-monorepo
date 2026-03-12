import { useEffect, useMemo, useRef } from 'react'
import { StatusGroup, type ThreatAnalysisResults } from '../types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import type { TypedData } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { mapHypernativeResponse } from '@safe-global/utils/features/safe-shield/utils/mapHypernativeResponse'
import { hypernativeApi } from '@safe-global/store/hypernative/hypernativeApi'
import { ErrorType, getErrorInfo } from '@safe-global/utils/features/safe-shield/utils/errors'
import { buildHypernativeMessageRequestData } from '@safe-global/utils/features/safe-shield/utils/buildHypernativeMessageRequestData'
import { useParsedOrigin } from './useParsedOrigin'
import { isHypernativeMessageAssessmentErrorResponse } from '@safe-global/store/hypernative/hypernativeApi.dto'

type UseThreatAnalysisHypernativeMessageProps = {
  safeAddress: `0x${string}`
  messageHash: `0x${string}`
  typedData: TypedData | undefined
  proposer?: `0x${string}`
  origin?: string
  authToken?: string
  skip?: boolean
}

/**
 * Hook for fetching threat analysis data for EIP-712 typed messages from Hypernative API
 * Makes a direct API call to Hypernative's EIP-712 message assessment endpoint
 * Requires an OAuth bearer token for authentication
 *
 * @param safeAddress - The Safe contract address
 * @param messageHash - The hash of the EIP-712 message
 * @param typedData - EIP-712 typed data to analyze for security threats
 * @param proposer - Optional address of the message proposer
 * @param origin - Optional origin identifier for the request (used to extract URL)
 * @param authToken - Optional OAuth bearer token from Hypernative authentication
 * @param skip - Skip the analysis (useful when Hypernative Guard is not installed)
 * @returns AsyncResult containing threat analysis results with loading and error states
 */
export function useThreatAnalysisHypernativeMessage({
  safeAddress,
  messageHash,
  typedData,
  proposer,
  origin: originProp,
  authToken,
  skip = false,
}: UseThreatAnalysisHypernativeMessageProps): AsyncResult<ThreatAnalysisResults> {
  const [triggerAssessment, { data: hypernativeData, error, isLoading }] = hypernativeApi.useAssessMessageMutation()

  // Track the last triggered message hash to prevent duplicate calls
  const lastTriggeredHashRef = useRef<string | null>(null)

  // Parse origin if it's a JSON string containing url
  const origin = useParsedOrigin(originProp)

  // Build Hypernative request payload
  const hypernativeRequest = useMemo(() => {
    if (skip || !typedData || !messageHash) {
      return undefined
    }

    return buildHypernativeMessageRequestData({
      safeAddress,
      messageHash,
      typedData,
      proposer,
      origin,
    })
  }, [typedData, safeAddress, messageHash, proposer, origin, skip])

  useEffect(() => {
    if (!skip && hypernativeRequest && authToken) {
      // Prevent duplicate calls for the same message hash
      if (lastTriggeredHashRef.current === hypernativeRequest.messageHash) {
        return
      }
      lastTriggeredHashRef.current = hypernativeRequest.messageHash

      console.log('[useThreatAnalysisHypernativeMessage] TRIGGERING ASSESSMENT!')
      triggerAssessment({
        ...hypernativeRequest,
        authToken,
      })
    }
  }, [hypernativeRequest, authToken, triggerAssessment, skip])

  const fetchError = useMemo(() => {
    if (!error) return undefined

    const errorMessage = isHypernativeMessageAssessmentErrorResponse(error)
      ? `${error.error.reason}: ${error.error.message}`
      : 'Failed to fetch Hypernative message threat analysis'
    return new Error(errorMessage)
  }, [error])

  const threatAnalysisResult = useMemo<ThreatAnalysisResults | undefined>(() => {
    if (skip) {
      return undefined
    }

    if (fetchError) {
      return { [StatusGroup.COMMON]: [getErrorInfo(ErrorType.THREAT)] }
    }

    if (!hypernativeData) {
      return undefined
    }

    return mapHypernativeResponse(
      {
        safeTxHash: hypernativeData.safeTxHash,
        status: hypernativeData.status,
        assessmentData: hypernativeData.assessmentData,
      },
      safeAddress,
    )
  }, [hypernativeData, fetchError, skip, safeAddress])

  if (!authToken && !skip) {
    return [undefined, new Error('authToken is required'), false]
  }

  return [threatAnalysisResult, fetchError, isLoading]
}
