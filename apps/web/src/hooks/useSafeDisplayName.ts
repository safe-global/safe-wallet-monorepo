import { useAddressBookItem } from '@/hooks/useAllAddressBooks'
import { useAddressResolver } from '@/hooks/useAddressResolver'

/**
 * Resolves the display name for a Safe address.
 * Priority: preferredName > address book > ENS
 */
export const useSafeDisplayName = (address: string, chainId: string, preferredName?: string): string => {
  const addressBookItem = useAddressBookItem(address, chainId)
  const existingName = preferredName || addressBookItem?.name
  const { ens } = useAddressResolver(existingName ? undefined : address)

  return existingName || ens || ''
}
