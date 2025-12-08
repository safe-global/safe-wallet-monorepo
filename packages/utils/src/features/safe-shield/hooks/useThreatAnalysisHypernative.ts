import { useEffect, useMemo, useState } from 'react'
import isEqual from 'lodash/isEqual'
import { StatusGroup, type ThreatAnalysisResults } from '../types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import type { TypedData } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import type { SafeTransaction } from '@safe-global/types-kit'
import { isSafeTransaction } from '@safe-global/utils/utils/safeTransaction'
import { getNestedExecTransactionHash } from '@safe-global/utils/utils/safeTransaction'
import { mapHypernativeResponse } from '@safe-global/utils/features/safe-shield/utils/mapHypernativeResponse'
import { hypernativeApi } from '@safe-global/store/hypernative/hypernativeApi'
import type { HypernativeAssessmentRequestDto } from '@safe-global/store/hypernative/hypernativeApi.dto'
import { ErrorType, getErrorInfo } from '@safe-global/utils/features/safe-shield/utils/errors'

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
  if (!authToken && !skip) {
    throw new Error('authToken is required')
  }

  const [data, setData] = useState<SafeTransaction | TypedData | undefined>(dataProp)
  const [triggerAssessment, { data: hypernativeData, error, isLoading }] = hypernativeApi.useAssessTransactionMutation()

  useEffect(() => {
    if (isSafeTransaction(dataProp) && isSafeTransaction(data)) {
      const { nonce: _nonce, ...dataWithoutNonce } = dataProp.data
      const { nonce: _prevNonce, ...prevDataWithoutNonce } = data.data
      if (isEqual(dataWithoutNonce, prevDataWithoutNonce)) return
    }

    setData(dataProp)
  }, [dataProp, data])

  // Parse origin if it's a JSON string containing url
  const origin = useMemo<string | undefined>(() => {
    if (originProp) {
      try {
        const parsed = JSON.parse(originProp)
        // Only use parsed.url if it's a non-empty string
        if (typeof parsed.url === 'string' && parsed.url.length > 0) {
          return parsed.url
        }
        // Otherwise leave origin undefined
      } catch {
        // Not JSON - use the original string as-is
        return originProp
      }
    }
  }, [originProp])

  // Build Hypernative request payload
  const hypernativeRequest = useMemo<HypernativeAssessmentRequestDto | undefined>(() => {
    if (!isSafeTransaction(data) || !safeAddress || !chainId || !safeVersion) {
      return undefined
    }

    const txData = data.data

    const safeTxHash = getNestedExecTransactionHash({
      safeAddress,
      safeVersion,
      chainId,
      txData,
    }) as `0x${string}`

    if (!safeTxHash) {
      return undefined
    }

    // @TODO: Add support for TypedData
    return {
      safeAddress,
      safeTxHash,
      transaction: {
        chain: chainId,
        input: txData.data as `0x${string}`,
        operation: txData.operation,
        toAddress: txData.to as `0x${string}`,
        fromAddress: walletAddress as `0x${string}`,
        safeTxGas: txData.safeTxGas,
        value: txData.value,
        gas: txData.baseGas,
        baseGas: txData.baseGas,
        gasPrice: txData.gasPrice,
        gasToken: txData.gasToken as `0x${string}`,
        refundReceiver: txData.refundReceiver as `0x${string}`,
        nonce: txData.nonce,
      },
      url: origin ?? '',
    }
  }, [data, safeAddress, chainId, walletAddress, origin, safeVersion])

  useEffect(() => {
    if (skip) {
      return
    }

    if (hypernativeRequest && authToken) {
      triggerAssessment({
        ...hypernativeRequest,
        authToken,
      })
    }
  }, [hypernativeRequest, authToken, triggerAssessment, skip])

  const fetchError = useMemo(
    () =>
      error ? new Error('error' in error ? error.error : 'Failed to fetch Hypernative threat analysis') : undefined,
    [error],
  )

  const threatAnalysisResult = useMemo<ThreatAnalysisResults | undefined>(() => {
    if (skip || !hypernativeData) {
      return undefined
    }

    if (fetchError) {
      return { [StatusGroup.COMMON]: [getErrorInfo(ErrorType.THREAT)] }
    }

    return mapHypernativeResponse(hypernativeData)
  }, [hypernativeData, fetchError, skip])

  return [threatAnalysisResult, fetchError, isLoading]
}
