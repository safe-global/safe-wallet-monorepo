import { useMemo, useRef, useState } from 'react'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { isAddress, JsonRpcProvider } from 'ethers'
import { ACTIVITY_THRESHOLD_LOW, LowActivityAnalysisResult } from '../config'
import { type AnalysisResult, RecipientStatus } from '../../../types'
import { useEffectDeepCompare, useAsyncDeepCompare } from '../../util-hooks'
import isEmpty from 'lodash/isEmpty'

export type AddressActivityResult = Record<string, AnalysisResult<RecipientStatus.LOW_ACTIVITY>>

/**
 * React hook to analyze activity for multiple addresses
 * @param addresses - Array of Ethereum addresses to analyze
 * @returns Object containing activity results for each address, loading state, and error
 */
export const useAddressActivity = (
  addresses: string[],
  web3ReadOnly?: JsonRpcProvider,
): AsyncResult<AddressActivityResult | undefined> => {
  const previousRecipientsRef = useRef<Set<string>>(new Set())
  const [results, setResults] = useState<AddressActivityResult | undefined>(undefined)

  // Determine which addresses changed and need fetching
  const addressesToFetch = useMemo(() => {
    const currentSet = new Set(addresses)
    const previousSet = previousRecipientsRef.current
    const toFetch: string[] = []

    currentSet.forEach((address) => {
      if (!previousSet.has(address)) {
        toFetch.push(address)
      }
    })

    return toFetch
  }, [addresses])

  // Update previous recipients after determining what to fetch
  useEffectDeepCompare(() => {
    previousRecipientsRef.current = new Set(addresses)
  }, [addresses])

  const [fetchedResults, error, loading] = useAsyncDeepCompare<AddressActivityResult | undefined>(async () => {
    if (!web3ReadOnly || addresses.length === 0) {
      return undefined
    }

    const activityResults: AddressActivityResult = {}

    await Promise.all(
      addressesToFetch.map(async (address) => {
        if (!address) return

        try {
          if (!isAddress(address)) {
            throw new Error('Invalid Ethereum address')
          }

          // Get transaction count using eth_getTransactionCount
          const txCount = await web3ReadOnly.getTransactionCount(address, 'latest')

          // Only add result if the address has low activity
          if (txCount < ACTIVITY_THRESHOLD_LOW) {
            activityResults[address] = LowActivityAnalysisResult
          }
        } catch (err) {
          console.error(`Address activity analysis error for ${address}:`, err)
          throw err
        }
      }),
    )

    return activityResults
  }, [addressesToFetch, web3ReadOnly, addresses])

  // Update results to only include addresses that are in the given addresses array
  useEffectDeepCompare(() => {
    if (!fetchedResults && addresses.length === 0) {
      setResults(undefined)
      return
    }

    setResults((prevResults) => {
      const newResults = addresses.reduce<AddressActivityResult>((acc, address) => {
        const addressResults = fetchedResults?.[address] || prevResults?.[address]
        if (addressResults) {
          acc[address] = addressResults
        }
        return acc
      }, {})
      return isEmpty(newResults) ? undefined : newResults
    })
  }, [addresses, fetchedResults])

  return [results, error, loading]
}
