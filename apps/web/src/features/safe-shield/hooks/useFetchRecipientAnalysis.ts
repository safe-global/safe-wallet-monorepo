import { useMemo, useRef, useState } from 'react'
import useChainId from '@/hooks/useChainId'
import useSafeAddress from '@/hooks/useSafeAddress'
import type { AddressAnalysisResults, RecipientAnalysisResults } from '../types'
import { GATEWAY_URL } from '@/config/gateway'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { useEffectDeepCompare } from './util-hooks/useEffectDeepCompare'
import { useAsyncDeepCompare } from './util-hooks/useAsyncDeepCompare'

/**
 * Fetches recipient analysis from backend
 * Returns RECIPIENT_INTERACTION results only
 * ADDRESS_BOOK and RECIPIENT_ACTIVITY are performed client-side
 */
async function fetchRecipientAnalysis(
  chainId: string,
  safeAddress: string,
  recipientAddress: string,
): Promise<AddressAnalysisResults | undefined> {
  const url = `${GATEWAY_URL}/v1/chains/${chainId}/security/${safeAddress}/recipient/${recipientAddress}`

  try {
    const response = await fetch(url)

    if (!response.ok) {
      if (response.status === 422) {
        throw new Error('Invalid Safe or recipient address')
      }
      if (response.status === 503) {
        throw new Error('Service unavailable')
      }
      throw new Error(`Failed to fetch recipient analysis: ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    console.error('Backend recipient analysis failed:', error)
    throw error
  }
}

/**
 * Hook to fetch recipient analysis from backend API
 * Tracks which recipients have been fetched and only fetches new ones
 * @param recipients - Array of recipient addresses to fetch analysis for
 * @returns Tuple of [results, error, loading] where results is keyed by recipient address
 */
export function useFetchRecipientAnalysis(recipients: string[]): AsyncResult<RecipientAnalysisResults> {
  const safeAddress = useSafeAddress()
  const chainId = useChainId()
  const previousRecipientsRef = useRef<Set<string>>(new Set())
  const [results, setResults] = useState<RecipientAnalysisResults>({})

  // Determine which addresses changed and need fetching
  const recipientsToFetch = useMemo(() => {
    const currentSet = new Set(recipients)
    const previousSet = previousRecipientsRef.current
    const toFetch: string[] = []

    currentSet.forEach((address) => {
      if (!previousSet.has(address)) {
        toFetch.push(address)
      }
    })

    return toFetch
  }, [recipients])

  // Update previous recipients after determining what to fetch
  useEffectDeepCompare(() => {
    previousRecipientsRef.current = new Set(recipients)
  }, [recipients])

  // Fetch backend analysis for each new recipient
  const [fetchedResults, error, loading] = useAsyncDeepCompare<RecipientAnalysisResults | undefined>(async () => {
    if (!safeAddress || recipientsToFetch.length === 0) {
      return
    }

    return Promise.all(
      recipientsToFetch.map(async (recipientAddress) => {
        const result = await fetchRecipientAnalysis(chainId, safeAddress, recipientAddress)
        return [recipientAddress, result] as const
      }),
    )
      .then((results) => {
        return results.reduce((acc, [address, result]) => ({ ...acc, [address]: result }), {})
      })
      .catch((err) => {
        console.error(`Failed to fetch recipient analysis`, err)
        throw err
      })
  }, [recipientsToFetch, chainId, safeAddress])

  // Update results to only include recipients that are in the given recipients array
  useEffectDeepCompare(() => {
    const newResults = recipients.reduce<RecipientAnalysisResults>((acc, address) => {
      acc[address] = fetchedResults?.[address] || results[address]
      return acc
    }, {})

    setResults(newResults)
  }, [recipients, fetchedResults, results])

  return [results, error, loading]
}
