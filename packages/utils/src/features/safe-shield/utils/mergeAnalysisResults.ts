import type { AddressBookCheckResult } from '../hooks/address-analysis/address-book-check/useAddressBookCheck'
import type { AddressActivityResult } from '../hooks/address-analysis/address-activity/useAddressActivity'
import { type RecipientAnalysisResults, StatusGroup } from '../types'
import { getAddress } from 'ethers'

/**
 * Merges backend and local check results
 * Backend provides RECIPIENT_INTERACTION (group 3)
 * Local checks provide ADDRESS_BOOK (group 1) and RECIPIENT_ACTIVITY (group 2)
 */
export function mergeAnalysisResults(
  fetchedResults: RecipientAnalysisResults | undefined,
  addressBookResult: AddressBookCheckResult | undefined,
  activityResult: AddressActivityResult | undefined,
): RecipientAnalysisResults {
  const merged: RecipientAnalysisResults = Object.keys(fetchedResults || {}).reduce((acc, address) => {
    const checksummedAddress = getAddress(address)
    acc[checksummedAddress] = fetchedResults?.[address]
    return acc
  }, {}) as RecipientAnalysisResults

  if (addressBookResult) {
    const addressBookEntries = Object.entries(addressBookResult || {})

    for (const [address, result] of addressBookEntries) {
      const checksummedAddress = getAddress(address)
      merged[checksummedAddress] = { ...(merged[checksummedAddress] || {}), [StatusGroup.ADDRESS_BOOK]: [result] }
    }
  }

  if (activityResult) {
    const activityEntries = Object.entries(activityResult || {})

    for (const [address, result] of activityEntries) {
      const checksummedAddress = getAddress(address)
      merged[checksummedAddress] = { ...(merged[checksummedAddress] || {}), [StatusGroup.RECIPIENT_ACTIVITY]: [result] }
    }
  }

  return merged
}
