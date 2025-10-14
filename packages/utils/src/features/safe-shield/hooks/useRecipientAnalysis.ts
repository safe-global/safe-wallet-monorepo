import { useMemo } from 'react'
import { isAddress, JsonRpcProvider } from 'ethers'
import uniq from 'lodash/uniq'
import {
  type AddressBookCheckResult,
  useAddressBookCheck,
} from './address-analysis/address-book-check/useAddressBookCheck'
import { type AddressActivityResult, useAddressActivity } from './address-analysis/address-activity/useAddressActivity'
import { type RecipientAnalysisResults, StatusGroup } from '../types'
import { useFetchRecipientAnalysis } from './useFetchRecipientAnalysis'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { useMemoDeepCompare } from './util-hooks/useMemoDeepCompare'
import useDebounce from '@safe-global/utils/hooks/useDebounce'

/**
 * Merges backend and local check results
 * Backend provides RECIPIENT_INTERACTION (group 3)
 * Local checks provide ADDRESS_BOOK (group 1) and RECIPIENT_ACTIVITY (group 2)
 */
function mergeAnalysisResults(
  fetchedResults: RecipientAnalysisResults | undefined,
  addressBookResult: AddressBookCheckResult,
  activityResult: AddressActivityResult | undefined,
): RecipientAnalysisResults {
  const merged: RecipientAnalysisResults = fetchedResults ? { ...fetchedResults } : {}

  for (const [address, result] of Object.entries(addressBookResult)) {
    merged[address] = { ...(merged[address] || {}), [StatusGroup.ADDRESS_BOOK]: [result] }
  }

  if (activityResult) {
    for (const [address, result] of Object.entries(activityResult)) {
      merged[address] = { ...(merged[address] || {}), [StatusGroup.RECIPIENT_ACTIVITY]: [result] }
    }
  }

  return merged
}

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
  const mergedResults = useMemo(
    () => mergeAnalysisResults(fetchedResults, addressBookCheck, activityCheck),
    [fetchedResults, addressBookCheck, activityCheck],
  )

  return [mergedResults, fetchedResultsError || activityCheckError, fetchLoading || activityCheckLoading]
}
