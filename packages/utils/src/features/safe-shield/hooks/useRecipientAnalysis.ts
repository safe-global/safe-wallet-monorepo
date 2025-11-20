import { useMemo } from 'react'
import { isAddress, JsonRpcProvider } from 'ethers'
import uniq from 'lodash/uniq'
import { useAddressBookCheck } from './address-analysis/address-book-check/useAddressBookCheck'
import { useAddressActivity } from './address-analysis/address-activity/useAddressActivity'
import { StatusGroup, type RecipientAnalysisResults } from '../types'
import { useFetchRecipientAnalysis } from './useFetchRecipientAnalysis'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { useMemoDeepCompare } from './util-hooks/useMemoDeepCompare'
import useDebounce from '@safe-global/utils/hooks/useDebounce'
import { filterNonSafeRecipients, mergeAnalysisResults } from '../utils'
import { ErrorType, getErrorInfo } from '../utils/errors'

/**
 * Hook for fetching and analyzing recipient addresses
 * Performs backend API calls and local checks (ADDRESS_BOOK, RECIPIENT_ACTIVITY)
 * Supports both single and multiple recipients
 *
 * @param recipients - Array of recipient addresses to analyze (can be single address)
 * @returns Object containing complete analysis results for each address, with loading and error states
 */
export function useRecipientAnalysis({
  safeAddress,
  chainId,
  recipients,
  isInAddressBook,
  web3ReadOnly,
  ownedSafes = [],
  debounceDelay = 500,
}: {
  safeAddress: string
  chainId: string
  recipients: string[] | undefined
  isInAddressBook: (address: string, chainId: string) => boolean
  ownedSafes: string[]
  web3ReadOnly?: JsonRpcProvider
  debounceDelay?: number
}): AsyncResult<RecipientAnalysisResults> | undefined {
  const recipientsMemo = useMemoDeepCompare(() => recipients, [recipients])

  // Debounce recipients to avoid excessive API calls during typing
  const debouncedRecipients = useDebounce(recipientsMemo, debounceDelay)

  // Validate + normalize addresses and remove duplicates
  const validRecipients = useMemo(() => {
    if (!debouncedRecipients) return []
    const filteredRecipients = debouncedRecipients
      .filter((address) => address && isAddress(address))
      .map((address) => address.toLowerCase())
    return uniq(filteredRecipients)
  }, [debouncedRecipients])

  const [fetchedResults, fetchedResultsError, fetchLoading] = useFetchRecipientAnalysis({
    safeAddress,
    chainId,
    recipients: validRecipients,
  })

  const nonSafeRecipients = useMemoDeepCompare(() => filterNonSafeRecipients(fetchedResults), [fetchedResults])

  const addressBookCheck = useAddressBookCheck(chainId, validRecipients, isInAddressBook, ownedSafes)
  const [activityCheck, activityCheckError, activityCheckLoading] = useAddressActivity(nonSafeRecipients, web3ReadOnly)

  // Check if any of the checks are loading or if the results are not complete
  const isLoading = useMemo(
    () =>
      fetchLoading ||
      activityCheckLoading ||
      (validRecipients.length > 0 && !fetchedResults) ||
      (nonSafeRecipients.length > 0 && Object.keys(activityCheck || {}).length !== nonSafeRecipients.length),
    [
      fetchLoading,
      activityCheckLoading,
      validRecipients.length,
      fetchedResults,
      nonSafeRecipients.length,
      activityCheck,
    ],
  )

  // Merge backend and local checks
  const mergedResults = useMemo(() => {
    if (fetchedResultsError || activityCheckError) {
      return { [safeAddress]: { [StatusGroup.COMMON]: [getErrorInfo(ErrorType.RECIPIENT)] } }
    }

    // Only merge results if all of them are available
    if (isLoading || validRecipients.length === 0) {
      return undefined
    }

    return mergeAnalysisResults(fetchedResults, addressBookCheck, activityCheck)
  }, [fetchedResults, addressBookCheck, activityCheck, fetchedResultsError, activityCheckError, isLoading, safeAddress, validRecipients])

  if (!recipientsMemo) {
    return undefined
  }

  return [mergedResults, fetchedResultsError || activityCheckError, isLoading]
}
