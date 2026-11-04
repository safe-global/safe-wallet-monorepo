import { useMemo } from 'react'
import { getAddress } from 'ethers'
import { useAppSelector } from '@/store'
import { selectAllAddressBooks, type AddressBook, type AddressBookState } from '@/store/addressBookSlice'
import useChainId from '@/hooks/useChainId'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { selectAccountAnchorAddresses, selectAnchorIndex } from '../store'

export type SimilarSavedAddress = {
  /** The saved address the checked one looks like, checksummed. */
  address: string
  /** Its address book name, if it has one. */
  name?: string
  /** A Safe in the user's accounts wins over a plain address book contact. */
  source: 'addressBook' | 'accounts'
}

const findName = (addressBook: AddressBook | undefined, address: string): string | undefined =>
  Object.entries(addressBook ?? {}).find(([saved]) => saved.toLowerCase() === address)?.[1] || undefined

/** The name on the current chain, else on any chain — the anchors themselves are cross-chain. */
const findSavedName = (addressBooks: AddressBookState, chainId: string, address: string): string | undefined =>
  findName(addressBooks[chainId], address) ??
  Object.values(addressBooks)
    .map((addressBook) => findName(addressBook, address))
    .find(Boolean)

/** The saved contact or account Safe that `address` looks like; undefined if none, itself saved, or partial. */
const useAddressPoisoningCheck = (address: string | undefined): SimilarSavedAddress | undefined => {
  const isEnabled = useHasFeature(FEATURES.ADDRESS_POISONING_PROTECTION)
  const chainId = useChainId()
  const anchorIndex = useAppSelector(selectAnchorIndex)
  const accountAnchors = useAppSelector(selectAccountAnchorAddresses)
  const addressBooks = useAppSelector(selectAllAddressBooks)

  return useMemo(() => {
    if (!isEnabled || !address) return undefined

    const match = anchorIndex.query(address)
    if (!match) return undefined

    const saved = `0x${match.anchor}`
    return {
      address: getAddress(saved),
      name: findSavedName(addressBooks, chainId, saved),
      source: accountAnchors.has(saved) ? 'accounts' : 'addressBook',
    }
  }, [isEnabled, address, anchorIndex, accountAnchors, addressBooks, chainId])
}

export default useAddressPoisoningCheck
