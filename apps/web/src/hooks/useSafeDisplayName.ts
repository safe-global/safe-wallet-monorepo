import { useAddressBookItem } from '@/hooks/useAllAddressBooks'
import { useAddressResolver } from '@/hooks/useAddressResolver'

/**
 * Resolves the display name for a Safe address.
 * Priority: space address book > local address book > ENS
 */
export const useSafeDisplayName = (address: string, chainId: string): string => {
  const addressBookItem = useAddressBookItem(address, chainId)
  const { ens } = useAddressResolver(addressBookItem?.name ? undefined : address)

  return addressBookItem?.name || ens || ''
}
