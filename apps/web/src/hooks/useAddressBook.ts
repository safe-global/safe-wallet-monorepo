import { useMemo } from 'react'
import { type AddressBook, selectAddressBookByChain } from '@/store/addressBookSlice'
import useChainId from './useChainId'
import { ContactSource, useMergedAddressBooks } from '@/hooks/useAllAddressBooks'
import { useAppSelector } from '@/store'
import { useAddressBookSource } from '@/components/common/AddressBookSourceProvider'

/**
 * Returns an address book for a given chain adhering to the merge logic from spaces and local
 */
const useAddressBook = (chainId?: string): AddressBook => {
  const fallbackChainId = useChainId()
  const actualChainId = chainId || fallbackChainId
  const source = useAddressBookSource()
  const mergedAddressBook = useMergedAddressBooks(actualChainId)

  const localAddressBook = useAppSelector((state) => selectAddressBookByChain(state, actualChainId))

  const merged = useMemo<AddressBook>(() => {
    const out: AddressBook = {}

    for (const contact of mergedAddressBook.list) {
      if (!contact.chainIds.includes(actualChainId)) continue
      if (source === 'spaceOnly' && contact.source !== ContactSource.space) continue

      const key = contact.address
      if (out[key] == null && contact.name?.trim()) {
        out[key] = contact.name
      }
    }

    return out
  }, [mergedAddressBook, actualChainId, source])

  if (source === 'localOnly') return localAddressBook

  return merged
}

export default useAddressBook
