import { useMemo } from 'react'
import { useCounterpartyAnalysis as useCounterpartyAnalysisUtils } from '@safe-global/utils/features/safe-shield/hooks'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useAppSelector } from '@/src/store/hooks'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useWeb3ReadOnly } from '@/src/hooks/wallets/web3'
import { selectAddressBookState } from '@/src/store/addressBookSlice'
import { selectAllSafes } from '@/src/store/safesSlice'
import type { RecipientAnalysisResults, ContractAnalysisResults } from '@safe-global/utils/features/safe-shield/types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import type { SafeTransaction } from '@safe-global/types-kit'

export function useCounterpartyAnalysis(overrideSafeTx?: SafeTransaction): {
  recipient?: AsyncResult<RecipientAnalysisResults>
  contract?: AsyncResult<ContractAnalysisResults>
} {
  const activeSafe = useDefinedActiveSafe()
  const safeAddress = activeSafe.address
  const chainId = activeSafe.chainId
  const web3ReadOnly = useWeb3ReadOnly()
  const addressBookState = useAppSelector(selectAddressBookState)
  const allSafes = useAppSelector(selectAllSafes)

  // Create isInAddressBook function that checks if address exists in address book for the given chainId
  const isInAddressBook = useMemo(() => {
    return (address: string, checkChainId: string): boolean => {
      // Check both exact match and case-insensitive match
      // First try exact lookup (fast path)
      let contact = addressBookState.contacts[address]

      // If not found, try lowercase lookup (addresses may be stored with different casing)
      if (!contact) {
        contact = addressBookState.contacts[address.toLowerCase()]
      }

      // If still not found, iterate through contacts for case-insensitive comparison
      // This handles cases where addresses are stored with checksummed casing
      if (!contact) {
        const contacts = Object.values(addressBookState.contacts)
        const foundContact = contacts.find((c) => sameAddress(c.value, address))
        if (foundContact) {
          contact = foundContact
        }
      }

      if (!contact) {
        return false
      }

      // Check if the chainId is in the contact's chainIds array
      return contact.chainIds.includes(checkChainId)
    }
  }, [addressBookState.contacts])

  // Get owned safes as an array of addresses
  const ownedSafes = useMemo(() => {
    return Object.keys(allSafes)
  }, [allSafes])

  return useCounterpartyAnalysisUtils({
    safeAddress,
    chainId,
    safeTx: overrideSafeTx,
    isInAddressBook,
    ownedSafes,
    web3ReadOnly,
  })
}
