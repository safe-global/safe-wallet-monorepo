import { useAddressBookItem } from '@/hooks/useAllAddressBooks'

/**
 * Resolves the display name for a single Safe address (priority: preferredName > address book).
 *
 * Use this when rendering ONE safe's name in a component. To resolve many names at once inside a
 * loop / filter / sort (where calling a hook per item isn't allowed), use {@link useSafeNameResolver}.
 */
export const useSafeDisplayName = (address: string, chainId: string, preferredName?: string): string => {
  const addressBookItem = useAddressBookItem(address, chainId)

  return preferredName || addressBookItem?.name || ''
}
