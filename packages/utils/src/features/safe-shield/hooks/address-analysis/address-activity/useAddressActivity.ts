import { useMemo, useRef, useState } from 'react'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { isAddress, JsonRpcProvider } from 'ethers'
import {
  ACTIVITY_CHECK_CONCURRENCY,
  ACTIVITY_THRESHOLD_LOW,
  LowActivityAnalysisResult,
  MAX_ACTIVITY_CHECK_ADDRESSES,
} from '../config'
import type { AnalysisResult, StatusGroup, StatusGroupType } from '../../../types'
import { ErrorType, getErrorInfo } from '../../../utils/errors'
import { useEffectDeepCompare, useAsyncDeepCompare } from '../../util-hooks'
import pick from 'lodash/pick'

export type AddressActivityResult = Record<
  string,
  AnalysisResult<StatusGroupType<StatusGroup.RECIPIENT_ACTIVITY>> | undefined
>

const fetchActivity = async (
  web3ReadOnly: JsonRpcProvider,
  address: string,
): Promise<AddressActivityResult[string]> => {
  if (!isAddress(address)) {
    throw new Error('Invalid Ethereum address')
  }

  const txCount = await web3ReadOnly.getTransactionCount(address, 'latest')

  return txCount < ACTIVITY_THRESHOLD_LOW ? LowActivityAnalysisResult : undefined
}

const fetchActivityInChunks = async (web3ReadOnly: JsonRpcProvider, addresses: string[]) => {
  const results: AddressActivityResult = {}
  const failures: unknown[] = []

  for (let i = 0; i < addresses.length; i += ACTIVITY_CHECK_CONCURRENCY) {
    const chunk = addresses.slice(i, i + ACTIVITY_CHECK_CONCURRENCY)
    const settled = await Promise.allSettled(chunk.map((address) => fetchActivity(web3ReadOnly, address)))

    settled.forEach((outcome, index) => {
      if (outcome.status === 'rejected') {
        failures.push(outcome.reason)
      }
      results[chunk[index]] = outcome.status === 'fulfilled' ? outcome.value : getErrorInfo(ErrorType.RECIPIENT)
    })
  }

  return { results, failures }
}

/**
 * React hook to analyze activity for multiple addresses.
 * Above MAX_ACTIVITY_CHECK_ADDRESSES addresses no lookup is made and every address resolves to `undefined`.
 * A failed lookup resolves to the recipient analysis error result.
 * @param addresses - Array of Ethereum addresses to analyze
 * @returns Object containing activity results for each address, loading state, and error.
 * A failed lookup is reported on its address and never sets the error.
 */
export const useAddressActivity = (
  addresses: string[],
  web3ReadOnly?: JsonRpcProvider,
): AsyncResult<AddressActivityResult | undefined> => {
  const previousRecipientsRef = useRef<Set<string>>(new Set())
  const [results, setResults] = useState<AddressActivityResult | undefined>(undefined)
  const [addressesToFetch, setAddressesToFetch] = useState<string[]>([])

  const overCap = addresses.length > MAX_ACTIVITY_CHECK_ADDRESSES
  const fetchable = overCap ? [] : addresses

  // Determine which addresses changed and need fetching
  useEffectDeepCompare(() => {
    const currentSet = new Set(fetchable)
    const previousSet = previousRecipientsRef.current
    const toFetch: string[] = []

    currentSet.forEach((address) => {
      if (!previousSet.has(address)) {
        toFetch.push(address)
      }
    })

    if (toFetch.length > 0 || overCap) {
      setAddressesToFetch(toFetch)
    }
  }, [fetchable])

  // Update previous recipients after determining what to fetch
  useEffectDeepCompare(() => {
    previousRecipientsRef.current = new Set(fetchable)
  }, [fetchable])

  const [fetchedResults, error, _loading] = useAsyncDeepCompare<AddressActivityResult | undefined>(async () => {
    if (!web3ReadOnly || !addressesToFetch.length) {
      return undefined
    }

    const { results: activityResults, failures } = await fetchActivityInChunks(web3ReadOnly, addressesToFetch)

    if (failures.length > 0) {
      console.error(
        `Address activity analysis failed for ${failures.length} of ${addressesToFetch.length} addresses:`,
        failures[0],
      )
    }

    return activityResults
  }, [addressesToFetch, web3ReadOnly])

  // Update results to only include addresses that are in the given addresses array
  useEffectDeepCompare(() => {
    if (addresses.length === 0) {
      setResults({})
      return
    }

    setResults((prevResults) => pick({ ...prevResults, ...fetchedResults }, addresses))
  }, [addresses, fetchedResults])

  // Check if the activity check is loading
  // We expect an entry for each address in the results array
  const isLoading = useMemo(
    () =>
      !error &&
      !!web3ReadOnly &&
      !overCap &&
      addresses.length > 0 &&
      Object.keys(results || {}).length !== addresses.length,
    [addresses.length, web3ReadOnly, overCap, results, error],
  )

  // Over the cap every address resolves to undefined, as if checked without a finding
  const skippedResults = useMemo(
    () => (overCap ? Object.fromEntries(addresses.map((address) => [address, undefined])) : undefined),
    [overCap, addresses],
  )

  return [skippedResults ?? results, error, isLoading]
}
