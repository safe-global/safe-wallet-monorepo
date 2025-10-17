import { useMemo } from 'react'
import { isAddress, JsonRpcProvider } from 'ethers'
import uniq from 'lodash/uniq'
import { useAddressBookCheck } from './address-analysis/address-book-check/useAddressBookCheck'
import { useAddressActivity } from './address-analysis/address-activity/useAddressActivity'
import { type RecipientAnalysisResults } from '../types'
import { useFetchRecipientAnalysis } from './useFetchRecipientAnalysis'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { useMemoDeepCompare } from './util-hooks/useMemoDeepCompare'
import useDebounce from '@safe-global/utils/hooks/useDebounce'
import { mergeAnalysisResults } from '../utils'

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
  recipients: string[]
  isInAddressBook: (address: string, chainId: string) => boolean
  ownedSafes: string[]
  web3ReadOnly?: JsonRpcProvider
  debounceDelay?: number
}): AsyncResult<RecipientAnalysisResults> {
  const recipientsMemo = useMemoDeepCompare(() => recipients, [recipients])

  // Debounce recipients to avoid excessive API calls during typing
  const debouncedRecipients = useDebounce(recipientsMemo, debounceDelay)

  // Validate + normalize addresses and remove duplicates
  const validRecipients = useMemo(() => {
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

  const addressBookCheck = useAddressBookCheck(chainId, validRecipients, isInAddressBook, ownedSafes)

  const [activityCheck, activityCheckError, activityCheckLoading] = useAddressActivity(validRecipients, web3ReadOnly)

  // Merge backend and local checks
  // Only merge address book results after fetched results are available
  const mergedResults = useMemo(() => {
    const addressBookToMerge = fetchedResults && addressBookCheck ? addressBookCheck : undefined
    return mergeAnalysisResults(fetchedResults, addressBookToMerge, activityCheck)
  }, [fetchedResults, addressBookCheck, activityCheck])

  return [mergedResults, fetchedResultsError || activityCheckError, fetchLoading || activityCheckLoading]
}
