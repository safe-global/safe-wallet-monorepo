import { useMemo, useRef, useState } from 'react'
import type { RecipientAnalysisResults } from '../types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { useEffectDeepCompare } from './util-hooks/useEffectDeepCompare'
import { useFetchMultiRecipientAnalysis } from './useFetchMultiRecipientAnalysis'
import isEmpty from 'lodash/isEmpty'

/**
 * Hook to fetch recipient analysis from backend API
 * Tracks which recipients have been fetched and only fetches new ones
 * @param recipients - Array of recipient addresses to fetch analysis for
 * @returns Tuple of [results, error, loading] where results is keyed by recipient address
 */
export function useFetchRecipientAnalysis({
  safeAddress,
  chainId,
  recipients,
}: {
  safeAddress: string
  chainId: string
  recipients: string[]
}): AsyncResult<RecipientAnalysisResults | undefined> {
  const previousRecipientsRef = useRef<Set<string>>(new Set())
  const [results, setResults] = useState<RecipientAnalysisResults | undefined>(undefined)

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

  const [fetchedResults, error, loading] = useFetchMultiRecipientAnalysis({
    safeAddress,
    chainId,
    recipientAddresses: recipientsToFetch,
  })

  // Update results to only include recipients that are in the given recipients array
  useEffectDeepCompare(() => {
    const newResults = recipients.reduce<RecipientAnalysisResults>((acc, address) => {
      const addressResults = fetchedResults?.[address] || results?.[address]
      if (addressResults) {
        acc[address] = addressResults
      }
      return acc
    }, {})

    setResults(isEmpty(newResults) ? undefined : newResults)
  }, [recipients, fetchedResults, results])

  return [results, error, loading]
}
