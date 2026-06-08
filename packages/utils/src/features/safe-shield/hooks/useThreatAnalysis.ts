import { useEffect, useMemo, useRef, useState } from 'react'
import { useSafeShieldAnalyzeThreatV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/safe-shield'
import isEqual from 'lodash/isEqual'
import { StatusGroup, type ThreatAnalysisResults } from '../types'
import type { AsyncResult } from '../../../hooks/useAsync'
import type { TypedData } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import type { SafeTransaction } from '@safe-global/types-kit'
import { generateTypedData } from '../utils/generateTypedData'
import { isSafeTransaction } from '../../../utils/safeTransaction'
import { ErrorType, getErrorInfo } from '../utils/errors'
import { transformThreatAnalysisResponse } from '../utils/transformThreatAnalysisResponse'
import { useParsedOrigin } from './useParsedOrigin'

type UseThreatAnalysisProps = {
  safeAddress: `0x${string}`
  chainId: string
  data: SafeTransaction | TypedData | undefined
  walletAddress: string
  origin?: string
  safeVersion?: string
  skip?: boolean
}

/**
 * Hook for fetching threat analysis data using EIP-712 typed data
 * Performs backend API call to analyze security threats in the transaction
 *
 * @param safeAddress - The Safe contract address
 * @param chainId - The chain ID where the Safe is deployed
 * @param data - EIP-712 typed data to analyze for security threats
 * @param walletAddress - Address of the transaction signer/wallet
 * @param origin - Optional origin identifier for the request
 * @returns AsyncResult containing threat analysis results with loading and error states
 */
export function useThreatAnalysis({
  safeAddress,
  chainId,
  data: dataProp,
  walletAddress,
  origin: originProp,
  safeVersion,
  skip = false,
}: UseThreatAnalysisProps): AsyncResult<ThreatAnalysisResults> {
  const [data, setData] = useState<SafeTransaction | TypedData | undefined>(dataProp)
  const [triggerAnalysis, { data: threatData, error, isLoading }] = useSafeShieldAnalyzeThreatV1Mutation()

  // Store previous data for comparison
  // We don't want to update the data if it's a SafeTransaction and only the nonce has changed
  useEffect(() => {
    if (isSafeTransaction(dataProp) && isSafeTransaction(data)) {
      const { nonce: _, ...dataWithoutNonce } = dataProp.data
      const { nonce: __, ...prevDataWithoutNonce } = data.data
      if (isEqual(dataWithoutNonce, prevDataWithoutNonce)) return
    }

    setData(dataProp)
  }, [dataProp, data])

  // Parse origin if it's a JSON string containing url
  const origin = useParsedOrigin(originProp)

  const typedData = useMemo(
    () =>
      data && safeAddress && chainId
        ? generateTypedData({
            data,
            safeAddress,
            chainId,
            safeVersion,
          })
        : undefined,
    [data, safeAddress, chainId, safeVersion],
  )

  // RTK Query mutations don't dedup or cancel, `data` reflects the last settled call. Abort
  // any in-flight request before triggering a new one so a slow stale response can't overwrite
  // a fresh result
  const inflightRef = useRef<{ abort?: () => void } | null>(null)

  // Trigger the mutation when typed data is available
  useEffect(() => {
    if (!skip && typedData && chainId && safeAddress && walletAddress) {
      inflightRef.current?.abort?.()
      const promise = triggerAnalysis({
        chainId,
        safeAddress,
        threatAnalysisRequestDto: {
          data: typedData,
          walletAddress,
          origin,
        },
      })
      inflightRef.current = promise ?? null
      return () => {
        promise?.abort?.()
      }
    }
  }, [typedData, chainId, safeAddress, walletAddress, origin, triggerAnalysis, skip])

  const fetchError = useMemo(
    () => (error ? new Error('error' in error ? error.error : 'Failed to fetch threat analysis') : undefined),
    [error],
  )

  const threatAnalysisResult = useMemo<ThreatAnalysisResults | undefined>(() => {
    if (skip) {
      return undefined
    }

    if (fetchError) {
      return { [StatusGroup.COMMON]: [getErrorInfo(ErrorType.THREAT)] }
    }
    return transformThreatAnalysisResponse(threatData)
  }, [threatData, fetchError, skip])

  return [threatAnalysisResult, fetchError, isLoading]
}
