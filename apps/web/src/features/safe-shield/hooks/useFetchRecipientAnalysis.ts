import { useEffect, useMemo, useRef, useState } from 'react'
import useChainId from '@/hooks/useChainId'
import useSafeAddress from '@/hooks/useSafeAddress'
import type { RecipientAnalysisResults } from '../types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { useEffectDeepCompare } from './util-hooks/useEffectDeepCompare'
import { useFetchMultiRecipientAnalysis } from './useFetchMultiRecipientAnalysis'

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
  const previousContextRef = useRef<{ chainId: string; safeAddress: string }>({ chainId: '', safeAddress: '' })
  const [results, setResults] = useState<RecipientAnalysisResults>({})

  // Clear cache and results when chainId or safeAddress changes
  useEffect(() => {
    const previousContext = previousContextRef.current
    if (previousContext.chainId !== chainId || previousContext.safeAddress !== safeAddress) {
      previousRecipientsRef.current.clear()
      setResults({})
      previousContextRef.current = { chainId, safeAddress }
    }
  }, [chainId, safeAddress])

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

  const [fetchedResults, error, loading] = useFetchMultiRecipientAnalysis(safeAddress, chainId, recipientsToFetch)

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
