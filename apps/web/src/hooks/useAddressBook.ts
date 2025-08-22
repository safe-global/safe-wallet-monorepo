import { useMemo } from 'react'
import { type AddressBook } from '@/store/addressBookSlice'
import useChainId from './useChainId'
import { ContactSource, useMergedAddressBooks } from '@/hooks/useAllAddressBooks'
import { useSearchParams } from 'next/navigation'

/**
 * Returns an address book for a given chain adhering to the merge logic from spaces and local
 */
const useAddressBook = (chainId?: string): AddressBook => {
  const fallbackChainId = useChainId()
  const querySafe = useSearchParams().get('safe')
  const actualChainId = chainId || fallbackChainId
  const source = querySafe ? 'merged' : 'spaceOnly'
  const mergedAddressBook = useMergedAddressBooks(actualChainId)

  return useMemo<AddressBook>(() => {
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
}

export default useAddressBook
