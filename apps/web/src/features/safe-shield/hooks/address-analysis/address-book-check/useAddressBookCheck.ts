import { useMemo } from 'react'
import useChainId from '@/hooks/useChainId'
import { useMergedAddressBooks } from '@/hooks/useAllAddressBooks'
import useOwnedSafes from '@/hooks/useOwnedSafes'
import { AddressCheckMessages, type AddressCheckType } from '../config'
import { RecipientStatus, Severity, type AnalysisResult } from '../../../types'

export type AddressBookCheckResult = Record<
  string,
  AnalysisResult<RecipientStatus.KNOWN_RECIPIENT | RecipientStatus.UNKNOWN_RECIPIENT>
>

/**
 * React hook to check if addresses are known from various sources
 * @param addresses - Array of Ethereum addresses to check
 * @returns Object containing check results for each address
 */
export const useAddressBookCheck = (addresses: string[]): AddressBookCheckResult => {
  const chainId = useChainId()
  const mergedAddressBooks = useMergedAddressBooks(chainId)
  const ownedSafes = useOwnedSafes(chainId)

  const results = useMemo(() => {
    const checkResults: AddressBookCheckResult = {}

    addresses.forEach((address) => {
      if (!address) {
        return
      }

      // Check if address is in merged address book (local or spaces)
      const isAddressBookContact = mergedAddressBooks.has(address, chainId)

      // Check if address is a Safe owned by the currently connected wallet
      const currentChainSafes = ownedSafes[chainId] || []
      const isOwnedSafe = currentChainSafes.some((safe) => safe.toLowerCase() === address.toLowerCase())

      // Determine if address is known from any source
      const isKnownAddress = isAddressBookContact || isOwnedSafe

      // Determine check type based on checks (priority: address book > owned safe > unknown)
      let checkType: AddressCheckType
      if (isAddressBookContact) {
        checkType = 'ADDRESS_BOOK'
      } else if (isOwnedSafe) {
        checkType = 'OWNED_SAFE'
      } else {
        checkType = 'UNKNOWN'
      }

      // Get message for this check type
      const message = AddressCheckMessages[checkType]

      // Determine severity
      const severity = isKnownAddress ? Severity.OK : Severity.INFO
      const type = isKnownAddress ? RecipientStatus.KNOWN_RECIPIENT : RecipientStatus.UNKNOWN_RECIPIENT

      checkResults[address] = { severity, type, ...message }
    })

    return checkResults
  }, [addresses, chainId, mergedAddressBooks, ownedSafes])

  return results
}
