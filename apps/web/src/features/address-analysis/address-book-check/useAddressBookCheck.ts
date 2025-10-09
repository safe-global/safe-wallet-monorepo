import useAsync from '@safe-global/utils/hooks/useAsync'
import useChainId from '@/hooks/useChainId'
import { useMergedAddressBooks } from '@/hooks/useAllAddressBooks'
import useOwnedSafes from '@/hooks/useOwnedSafes'

export enum AddressCheckDescription {
  ADDRESS_BOOK = 'Recipient is in the address book',
  OWNED_SAFE = 'Recipient is an owned Safe',
  UNKNOWN = 'Recipient is not in the address book and not an owned Safe',
}

export enum AddressCheckSeverity {
  OK = 'OK',
  INFO = 'INFO',
}

type UseAddressBookCheckReturn = {
  isKnownAddress: boolean
  isAddressBookContact: boolean
  isOwnedSafe: boolean
  description: AddressCheckDescription
  severity: AddressCheckSeverity
  loading: boolean
  error?: Error
}

/**
 * React hook to check if an address is known from various sources
 * @param address - Ethereum address to check
 * @returns Object containing check results, loading state, and error
 */
export const useAddressBookCheck = (address: string | undefined): UseAddressBookCheckReturn => {
  const chainId = useChainId()
  const mergedAddressBooks = useMergedAddressBooks(chainId)
  const ownedSafes = useOwnedSafes(chainId)

  const [result, error, loading] = useAsync<
    Omit<UseAddressBookCheckReturn, 'loading' | 'error'> | undefined
  >(async () => {
    if (!address) {
      return undefined
    }

    // Check if address is in merged address book (local or spaces)
    const isAddressBookContact = mergedAddressBooks.has(address, chainId)

    // Check if address is a Safe owned by the currently connected wallet
    const currentChainSafes = ownedSafes[chainId] || []
    const isOwnedSafe = currentChainSafes.some((safe) => safe.toLowerCase() === address.toLowerCase())

    // Determine if address is known from any source
    const isKnownAddress = isAddressBookContact || isOwnedSafe

    // Determine description based on checks (priority: address book > owned safe > unknown)
    let description: AddressCheckDescription
    if (isAddressBookContact) {
      description = AddressCheckDescription.ADDRESS_BOOK
    } else if (isOwnedSafe) {
      description = AddressCheckDescription.OWNED_SAFE
    } else {
      description = AddressCheckDescription.UNKNOWN
    }

    // Determine severity
    const severity = isKnownAddress ? AddressCheckSeverity.OK : AddressCheckSeverity.INFO

    return {
      isKnownAddress,
      isAddressBookContact,
      isOwnedSafe,
      description,
      severity,
    }
  }, [address, chainId, mergedAddressBooks, ownedSafes])

  return {
    isKnownAddress: result?.isKnownAddress ?? false,
    isAddressBookContact: result?.isAddressBookContact ?? false,
    isOwnedSafe: result?.isOwnedSafe ?? false,
    description: result?.description ?? AddressCheckDescription.UNKNOWN,
    severity: result?.severity ?? AddressCheckSeverity.INFO,
    loading,
    error,
  }
}
