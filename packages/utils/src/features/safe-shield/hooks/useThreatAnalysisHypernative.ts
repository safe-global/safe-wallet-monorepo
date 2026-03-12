import { useEffect, useMemo, useState } from 'react'
import isEqual from 'lodash/isEqual'
import { StatusGroup, type ThreatAnalysisResults } from '../types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import type { TypedData } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import type { SafeTransaction } from '@safe-global/types-kit'
import { isSafeTransaction } from '@safe-global/utils/utils/safeTransaction'
import { mapHypernativeResponse } from '@safe-global/utils/features/safe-shield/utils/mapHypernativeResponse'
import { hypernativeApi } from '@safe-global/store/hypernative/hypernativeApi'
import { ErrorType, getErrorInfo } from '@safe-global/utils/features/safe-shield/utils/errors'
import { buildHypernativeRequestData } from '@safe-global/utils/features/safe-shield/utils/buildHypernativeRequestData'
import { useParsedOrigin } from './useParsedOrigin'
import { isHypernativeAssessmentFailedResponse } from '@safe-global/store/hypernative/hypernativeApi.dto'
import useDebounce from '@safe-global/utils/hooks/useDebounce'

type UseThreatAnalysisHypernativeProps = {
  safeAddress: `0x${string}`
  chainId: string
  data: SafeTransaction | TypedData | undefined
  walletAddress: string
  origin?: string
  safeVersion?: string
  authToken?: string
  skip?: boolean
}

/**
 * Hook for fetching threat analysis data from Hypernative API
 * Makes a direct API call to Hypernative's assessment endpoint
 * Requires an OAuth bearer token for authentication
 *
 * @param safeAddress - The Safe contract address
 * @param chainId - The chain ID where the Safe is deployed
 * @param data - SafeTransaction or EIP-712 typed data to analyze for security threats
 * @param walletAddress - Address of the transaction signer/wallet
 * @param origin - Optional origin identifier for the request (used to extract URL)
 * @param safeVersion - Version of the Safe contract
 * @param authToken - Optional OAuth bearer token from Hypernative authentication
 * @param skip - Skip the analysis (useful when Hypernative Guard is not installed)
 * @returns AsyncResult containing threat analysis results with loading and error states
 */
export function useThreatAnalysisHypernative({
  safeAddress,
  chainId,
  data: dataProp,
  walletAddress,
  origin: originProp,
  safeVersion,
  authToken,
  skip = false,
}: UseThreatAnalysisHypernativeProps): AsyncResult<ThreatAnalysisResults> {
  const debouncedData = useDebounce(dataProp, 300)
  const [data, setData] = useState<SafeTransaction | TypedData | undefined>(dataProp)
  const [triggerAssessment, { data: hypernativeData, error, isLoading }] = hypernativeApi.useAssessTransactionMutation()

  useEffect(() => {
    if (isSafeTransaction(debouncedData) && isSafeTransaction(data) && isEqual(debouncedData.data, data.data)) {
      return
    }
    setData(debouncedData)
  }, [debouncedData, data])

  // Parse origin if it's a JSON string containing url
  const origin = useParsedOrigin(originProp)

  // Build Hypernative request payload
  // @TODO: Add support for TypedData
  const hypernativeRequest = useMemo(() => {
    if (skip || !isSafeTransaction(data) || !safeVersion) {
      return undefined
    }

    return buildHypernativeRequestData({
      safeAddress,
      chainId,
      txData: data.data,
      walletAddress,
      safeVersion,
      origin,
    })
  }, [data, safeAddress, chainId, walletAddress, origin, safeVersion, skip])

  useEffect(() => {
    if (!skip && hypernativeRequest && authToken && walletAddress) {
      triggerAssessment({
        ...hypernativeRequest,
        authToken,
      })
    }
  }, [hypernativeRequest, authToken, triggerAssessment, skip, walletAddress])

  const fetchError = useMemo(() => {
    const errorMessage = isHypernativeAssessmentFailedResponse(error)
      ? error.error
      : 'Failed to fetch Hypernative threat analysis'
    return error ? new Error(errorMessage) : undefined
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

    return mapHypernativeResponse(hypernativeData, safeAddress)
  }, [hypernativeData, fetchError, skip, safeAddress])

  if (!authToken && !skip) {
    return [undefined, new Error('authToken is required'), false]
  }

  return [threatAnalysisResult, fetchError, isLoading]
}
