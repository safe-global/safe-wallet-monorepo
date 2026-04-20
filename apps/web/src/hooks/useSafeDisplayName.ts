import { useAddressBookItem } from '@/hooks/useAllAddressBooks'
import { useAddressResolver } from '@/hooks/useAddressResolver'

/**
 * Resolves the display name for a Safe address.
 * Priority: preferredName > address book
 */
export const useSafeDisplayName = (address: string, chainId: string, preferredName?: string): string => {
  const addressBookItem = useAddressBookItem(address, chainId)
  const { ens } = useAddressResolver(address)

  return preferredName || addressBookItem?.name || ens || ''
}
