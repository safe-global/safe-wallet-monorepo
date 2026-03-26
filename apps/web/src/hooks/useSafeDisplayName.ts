import { useAddressBookItem } from '@/hooks/useAllAddressBooks'

/**
 * Resolves the display name for a Safe address.
 * Priority: preferredName > address book
 *
 * NOTE: ENS resolution is intentionally excluded here.
 * `useAddressResolver` (which calls Infura) has no negative-result cache — addresses
 * without an ENS name are re-fetched on every component mount. Calling it here would
 * trigger one Infura request per Safe item rendered in the dropdown, and duplicate the
 * ENS lookup already performed by SafeHeaderInfo for the currently selected Safe.
 *
 * The proper fix is to cache ENS results (including null) in the Redux store so each
 * address is only resolved once per session. Until that is implemented, ENS is omitted
 * to avoid excessive RPC calls that risk hitting rate limits (HTTP 429).
 */
export const useSafeDisplayName = (address: string, chainId: string, preferredName?: string): string => {
  const addressBookItem = useAddressBookItem(address, chainId)

  return preferredName || addressBookItem?.name || ''
}
