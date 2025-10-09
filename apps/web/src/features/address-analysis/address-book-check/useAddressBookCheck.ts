import useAsync from '@safe-global/utils/hooks/useAsync'
import useChainId from '@/hooks/useChainId'
import { useMergedAddressBooks } from '@/hooks/useAllAddressBooks'
import useOwnedSafes from '@/hooks/useOwnedSafes'
import { AddressCheckMessages, AnalysisSeverity, type AddressCheckType } from '../config'

type UseAddressBookCheckReturn = {
  isKnownAddress: boolean
  isAddressBookContact: boolean
  isOwnedSafe: boolean
  checkType: AddressCheckType
  title: string
  description: string
  severity: AnalysisSeverity
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
    const severity = isKnownAddress ? AnalysisSeverity.OK : AnalysisSeverity.INFO

    return {
      isKnownAddress,
      isAddressBookContact,
      isOwnedSafe,
      checkType,
      title: message.title,
      description: message.description,
      severity,
    }
  }, [address, chainId, mergedAddressBooks, ownedSafes])

  const defaultMessage = AddressCheckMessages.UNKNOWN

  return {
    isKnownAddress: result?.isKnownAddress ?? false,
    isAddressBookContact: result?.isAddressBookContact ?? false,
    isOwnedSafe: result?.isOwnedSafe ?? false,
    checkType: result?.checkType ?? 'UNKNOWN',
    title: result?.title ?? defaultMessage.title,
    description: result?.description ?? defaultMessage.description,
    severity: result?.severity ?? AnalysisSeverity.INFO,
    loading,
    error,
  }
}
