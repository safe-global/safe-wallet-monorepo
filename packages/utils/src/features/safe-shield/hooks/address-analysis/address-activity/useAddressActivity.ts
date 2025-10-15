import { useMemo, useRef, useState } from 'react'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { JsonRpcProvider } from 'ethers'
import { analyzeAddressActivity, isLowActivityAddress } from './addressActivityService'
import { ActivityMessages } from '../config'
import { type AnalysisResult, RecipientStatus, Severity } from '../../../types'
import { useEffectDeepCompare, useAsyncDeepCompare } from '../../util-hooks'

export type AddressActivityResult = Record<
  string,
  AnalysisResult<RecipientStatus.LOW_ACTIVITY | RecipientStatus.HIGH_ACTIVITY>
>

/**
 * React hook to analyze activity for multiple addresses
 * @param addresses - Array of Ethereum addresses to analyze
 * @returns Object containing activity results for each address, loading state, and error
 */
export const useAddressActivity = (
  addresses: string[],
  web3ReadOnly?: JsonRpcProvider,
): AsyncResult<AddressActivityResult> => {
  const previousRecipientsRef = useRef<Set<string>>(new Set())
  const [results, setResults] = useState<AddressActivityResult>({})

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
          const assessment = await analyzeAddressActivity(address, web3ReadOnly)
          const message = ActivityMessages[assessment.activityLevel]
          const severity = isLowActivityAddress(assessment) ? Severity.WARN : Severity.OK
          const type = isLowActivityAddress(assessment) ? RecipientStatus.LOW_ACTIVITY : RecipientStatus.HIGH_ACTIVITY

          activityResults[address] = { type, severity, ...message }
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
      setResults({})
      return
    }

    setResults((prevResults) => {
      const newResults = addresses.reduce<AddressActivityResult>((acc, address) => {
        acc[address] = fetchedResults?.[address] || prevResults[address]
        return acc
      }, {})
      return newResults
    })
  }, [addresses, fetchedResults])

  return [results, error, loading]
}
