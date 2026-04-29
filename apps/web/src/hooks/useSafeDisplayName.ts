import { useAddressBookItem } from '@/hooks/useAllAddressBooks'

/**
 * Resolves the display name for a Safe address.
 * Priority: preferredName > address book
 */
export const useSafeDisplayName = (address: string, chainId: string, preferredName?: string): string => {
  const addressBookItem = useAddressBookItem(address, chainId)

  return preferredName || addressBookItem?.name || ''
}
