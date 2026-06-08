import { useAppSelector } from '@/store'
import { type AddressBook, selectAddressBookByChain, selectAllAddressBooks } from '@/store/addressBookSlice'
import { type SpaceAddressBookItemDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useCallback, useMemo } from 'react'
import useChainId from '@/hooks/useChainId'
import { useGetSpaceAddressBook, useGetPrivateAddressBook } from '@/features/spaces'
import { useAddressBookSource } from '@/components/common/AddressBookSourceProvider'

export enum ContactSource {
  space = 'space',
  private = 'private',
  local = 'local',
}

export type ExtendedContact = SpaceAddressBookItemDto & { source: ContactSource }

const mapLocalToContacts = (addressBook: AddressBook, chainId: string): ExtendedContact[] => {
  return Object.entries(addressBook).map(([address, name]) => ({
    name,
    address,
    chainIds: [chainId],
    createdBy: '',
    createdByUserId: 0,
    lastUpdatedBy: '',
    lastUpdatedByUserId: 0,
    createdAt: '',
    updatedAt: '',
    source: ContactSource.local,
  }))
}

const mapSpaceToContacts = (addressBook: SpaceAddressBookItemDto[]): ExtendedContact[] => {
  if (!addressBook) return []

  return addressBook.map<ExtendedContact>((entry) => ({
    ...entry,
    source: ContactSource.space,
  }))
}

const mapPrivateToContacts = (addressBook: SpaceAddressBookItemDto[]): ExtendedContact[] => {
  if (!addressBook) return []

  return addressBook.map<ExtendedContact>((entry) => ({
    ...entry,
    source: ContactSource.private,
  }))
}

const addressBookKey = (address: string, chainId: string) => `${chainId}:${address.toLowerCase()}`

export type MergedAddressBook = {
  list: ExtendedContact[]
  get: (address: string, chainId: string) => ExtendedContact | undefined
  getFromSpace: (address: string, chainId: string) => ExtendedContact | undefined
  getFromLocal: (address: string, chainId: string) => ExtendedContact | undefined
  has: (address: string, chainId: string) => boolean
}

export const useMergedAddressBooks = (chainId?: string): MergedAddressBook => {
  const fallbackChainId = useChainId()
  const actualChainId = chainId ?? fallbackChainId
  const spaceAddressBook = useGetSpaceAddressBook()
  const privateAddressBook = useGetPrivateAddressBook()
  const localAddressBook = useAppSelector((state) => selectAddressBookByChain(state, actualChainId))

  return useMemo<MergedAddressBook>(() => {
    const byKeyMerged = new Map<string, ExtendedContact>()
    const byKeySpace = new Map<string, ExtendedContact>()
    const byKeyLocal = new Map<string, ExtendedContact>()

    const spaceContacts = mapSpaceToContacts(spaceAddressBook)
    const privateContacts = mapPrivateToContacts(privateAddressBook)
    const localContacts = mapLocalToContacts(localAddressBook, actualChainId)

    // Priority 1: Space contacts (highest)
    for (const spaceContact of spaceContacts) {
      for (const chainId of spaceContact.chainIds) {
        const key = addressBookKey(spaceContact.address, chainId)
        byKeySpace.set(key, { ...spaceContact, chainIds: [chainId] })
        byKeyMerged.set(key, { ...spaceContact, chainIds: [chainId] })
      }
    }

    // Priority 2: Private contacts
    for (const privateContact of privateContacts) {
      for (const cid of privateContact.chainIds) {
        const key = addressBookKey(privateContact.address, cid)
        if (!byKeyMerged.has(key)) {
          byKeyMerged.set(key, { ...privateContact, chainIds: [cid] })
        }
      }
    }

    // Priority 3: Local contacts (lowest)
    for (const localContact of localContacts) {
      const key = addressBookKey(localContact.address, actualChainId)

      byKeyLocal.set(key, localContact)

      if (!byKeyMerged.has(key)) {
        byKeyMerged.set(key, localContact)
      }
    }

    // Build list: space + non-duplicate private + non-duplicate local
    // Private keeps any chainIds not covered by a matching space entry
    const filteredPrivate = privateContacts.flatMap((priv) => {
      const spaceChainIds = new Set(
        spaceContacts.filter((space) => sameAddress(space.address, priv.address)).flatMap((space) => space.chainIds),
      )
      const remainingChainIds = priv.chainIds.filter((cid) => !spaceChainIds.has(cid))
      return remainingChainIds.length > 0 ? [{ ...priv, chainIds: remainingChainIds }] : []
    })
    const filteredLocal = localContacts.filter(
      (local) =>
        !spaceContacts.some(
          (space) => sameAddress(space.address, local.address) && space.chainIds.includes(actualChainId),
        ) &&
        !privateContacts.some(
          (priv) => sameAddress(priv.address, local.address) && priv.chainIds.includes(actualChainId),
        ),
    )

    const list = [...spaceContacts, ...filteredPrivate, ...filteredLocal]
    const get = (address: string, chainId: string) => byKeyMerged.get(addressBookKey(address, chainId))
    const has = (address: string, chainId: string) => byKeyMerged.has(addressBookKey(address, chainId))
    const getFromSpace = (address: string, cid: string) => byKeySpace.get(addressBookKey(address, cid))
    const getFromLocal = (address: string, cid: string) => byKeyLocal.get(addressBookKey(address, cid))

    return { list, get, has, getFromSpace, getFromLocal }
  }, [actualChainId, localAddressBook, spaceAddressBook, privateAddressBook])
}

/**
 * Return a name for the given address and chainId either
 * from the local address book or from a space address book
 * @param address
 * @param chainId
 */
export const useAddressBookItem = (address: string, chainId: string | undefined): ExtendedContact | undefined => {
  const { get, getFromLocal } = useMergedAddressBooks(chainId)
  const source = useAddressBookSource()

  return useMemo<ExtendedContact | undefined>(() => {
    if (!chainId) return undefined

    if (source === 'localOnly') {
      return getFromLocal(address, chainId)
    }

    if (source === 'merged') {
      return get(address, chainId)
    }

    if (source === 'spaceOnly') {
      const item = get(address, chainId)
      return item?.source === ContactSource.space ? item : undefined
    }

    return undefined
  }, [chainId, source, getFromLocal, address, get])
}

/**
 * Returns a source-aware resolver for safe display names, mirroring {@link useSafeDisplayName}
 * (`preferredName > address book`) but usable across many addresses without a hook per item.
 *
 * Needed for list filtering (e.g. the account dropdown search): the visible name often comes
 * from the address book, not the safe's own `name`, so searching the raw name misses those safes.
 *
 * Keep the source priority below in sync with {@link useSafeDisplayName}/{@link useAddressBookItem}:
 * this is the array-friendly twin of that per-item hook, so the two must resolve names identically.
 */
export const useSafeNameResolver = (): ((
  address: string,
  chainId: string | undefined,
  preferredName?: string,
) => string) => {
  const { get } = useMergedAddressBooks()
  const allLocal = useAppSelector(selectAllAddressBooks)
  const source = useAddressBookSource()

  // Flatten every chain's local book into a lowercased lookup so names on chains other than the
  // currently-loaded one still resolve (the merged map only carries the current chain's locals).
  const localByKey = useMemo(() => {
    const map = new Map<string, string>()
    for (const [cid, book] of Object.entries(allLocal)) {
      for (const [addr, name] of Object.entries(book)) {
        map.set(addressBookKey(addr, cid), name)
      }
    }
    return map
  }, [allLocal])

  return useCallback(
    (address, chainId, preferredName) => {
      if (preferredName) return preferredName
      if (!chainId) return ''
      const localName = localByKey.get(addressBookKey(address, chainId))
      if (source === 'localOnly') return localName ?? ''
      const item = get(address, chainId)
      if (source === 'spaceOnly') return item?.source === ContactSource.space ? (item.name ?? '') : ''
      // merged: space/private (cross-chain) take priority, then any chain's local
      return item?.name ?? localName ?? ''
    },
    [get, source, localByKey],
  )
}

// Returns all local address books
const useAllAddressBooks = () => useAppSelector(selectAllAddressBooks)

export default useAllAddressBooks
