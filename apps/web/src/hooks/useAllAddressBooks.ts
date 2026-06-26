import { useAppSelector } from '@/store'
import { type AddressBook, selectAddressBookByChain, selectAllAddressBooks } from '@/store/addressBookSlice'
import { type SpaceAddressBookItemDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useCallback, useMemo } from 'react'
import useChainId from '@/hooks/useChainId'
import { useGetSpaceAddressBook } from '@/features/spaces'
import { useAddressBookSource } from '@/components/common/AddressBookSourceProvider'

export enum ContactSource {
  space = 'space',
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

const addressBookKey = (address: string, chainId: string) =>
  `${chainId}:${typeof address === 'string' ? address.toLowerCase() : address}`

export type MergedAddressBook = {
  list: ExtendedContact[]
  get: (address: string, chainId: string) => ExtendedContact | undefined
  getFromSpace: (address: string, chainId: string) => ExtendedContact | undefined
  getFromLocal: (address: string, chainId: string) => ExtendedContact | undefined
  /** Space contact for this address regardless of chain (one name per address, full chainIds). */
  getFromSpaceByAddress: (address: string) => ExtendedContact | undefined
  /** Local contact for this address from any chain — cross-chain inheritance fallback. */
  getFromLocalAnyChain: (address: string) => ExtendedContact | undefined
  has: (address: string, chainId: string) => boolean
}

export const useMergedAddressBooks = (chainId?: string): MergedAddressBook => {
  const fallbackChainId = useChainId()
  const actualChainId = chainId ?? fallbackChainId
  const spaceAddressBook = useGetSpaceAddressBook()
  const localAddressBook = useAppSelector((state) => selectAddressBookByChain(state, actualChainId))
  // Every chain's local book, for address-level (cross-chain) fallback so a name set on one chain
  // is inherited when the same Safe appears on another chain.
  const allLocalBooks = useAppSelector(selectAllAddressBooks)

  return useMemo<MergedAddressBook>(() => {
    const byKeyMerged = new Map<string, ExtendedContact>()
    const byKeySpace = new Map<string, ExtendedContact>()
    const byKeyLocal = new Map<string, ExtendedContact>()
    // Address-level (chain-agnostic) maps: one entry per address.
    const byAddressSpace = new Map<string, ExtendedContact>()
    const byAddressLocal = new Map<string, ExtendedContact>()

    const spaceContacts = mapSpaceToContacts(spaceAddressBook)
    const localContacts = mapLocalToContacts(localAddressBook, actualChainId)

    // Priority 1: Space contacts (highest)
    for (const spaceContact of spaceContacts) {
      byAddressSpace.set(spaceContact.address.toLowerCase(), spaceContact) // full chainIds preserved
      for (const chainId of spaceContact.chainIds) {
        const key = addressBookKey(spaceContact.address, chainId)
        byKeySpace.set(key, { ...spaceContact, chainIds: [chainId] })
        byKeyMerged.set(key, { ...spaceContact, chainIds: [chainId] })
      }
    }

    // Priority 2: Local contacts (lowest)
    for (const localContact of localContacts) {
      const key = addressBookKey(localContact.address, actualChainId)

      byKeyLocal.set(key, localContact)

      if (!byKeyMerged.has(key)) {
        byKeyMerged.set(key, localContact)
      }
    }

    // Address-level local from EVERY chain: the current chain's name wins, otherwise any chain's.
    for (const [cid, book] of Object.entries(allLocalBooks)) {
      for (const localContact of mapLocalToContacts(book, cid)) {
        const addrKey = localContact.address.toLowerCase()
        if (cid === actualChainId || !byAddressLocal.has(addrKey)) {
          byAddressLocal.set(addrKey, localContact)
        }
      }
    }

    // Build list: space + non-duplicate local
    const filteredLocal = localContacts.filter(
      (local) =>
        !spaceContacts.some(
          (space) => sameAddress(space.address, local.address) && space.chainIds.includes(actualChainId),
        ),
    )

    const list = [...spaceContacts, ...filteredLocal]
    const get = (address: string, chainId: string) => byKeyMerged.get(addressBookKey(address, chainId))
    const has = (address: string, chainId: string) => byKeyMerged.has(addressBookKey(address, chainId))
    const getFromSpace = (address: string, cid: string) => byKeySpace.get(addressBookKey(address, cid))
    const getFromLocal = (address: string, cid: string) => byKeyLocal.get(addressBookKey(address, cid))
    const getFromSpaceByAddress = (address: string) =>
      typeof address === 'string' ? byAddressSpace.get(address.toLowerCase()) : undefined
    const getFromLocalAnyChain = (address: string) =>
      typeof address === 'string' ? byAddressLocal.get(address.toLowerCase()) : undefined

    return { list, get, has, getFromSpace, getFromLocal, getFromSpaceByAddress, getFromLocalAnyChain }
  }, [actualChainId, localAddressBook, spaceAddressBook, allLocalBooks])
}

/**
 * Return a name for the given address and chainId either
 * from the local address book or from a space address book
 * @param address
 * @param chainId
 */
export const useAddressBookItem = (address: string, chainId: string | undefined): ExtendedContact | undefined => {
  const { getFromSpaceByAddress, getFromLocal, getFromLocalAnyChain } = useMergedAddressBooks(chainId)
  const source = useAddressBookSource()

  return useMemo<ExtendedContact | undefined>(() => {
    if (!chainId) return undefined

    // Local book view: strictly per-chain (editing a specific chain's entry).
    if (source === 'localOnly') {
      return getFromLocal(address, chainId)
    }

    // Space name resolves by address (one name per address, shown on every chain).
    const spaceItem = getFromSpaceByAddress(address)

    if (source === 'spaceOnly') {
      return spaceItem
    }

    // merged: space (any chain) > local (this chain) > local (any chain, for cross-chain inheritance)
    return spaceItem ?? getFromLocal(address, chainId) ?? getFromLocalAnyChain(address)
  }, [chainId, source, address, getFromSpaceByAddress, getFromLocal, getFromLocalAnyChain])
}

/**
 * Returns a source-aware resolver for safe display names, mirroring {@link useSafeDisplayName}
 * (`preferredName > address book`) but usable across many addresses without a hook per item.
 *
 * Use this only to resolve names in bulk inside a loop / filter / sort (e.g. the account dropdown
 * search) — the visible name often comes from the address book, not the safe's own `name`, so
 * filtering the raw name misses those safes. For a single name in a component use the lighter
 * {@link useSafeDisplayName} instead.
 *
 * Keep the source priority below in sync with {@link useSafeDisplayName}/{@link useAddressBookItem}:
 * this is the array-friendly twin of that per-item hook, so the two must resolve names identically.
 */
export const useSafeNameResolver = (): ((
  address: string,
  chainId: string | undefined,
  preferredName?: string,
) => string) => {
  const { getFromSpaceByAddress } = useMergedAddressBooks()
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

  // Address-level local lookup (any chain) for cross-chain inheritance.
  const localByAddress = useMemo(() => {
    const map = new Map<string, string>()
    for (const [, book] of Object.entries(allLocal)) {
      for (const [addr, name] of Object.entries(book)) {
        map.set(addr.toLowerCase(), name)
      }
    }
    return map
  }, [allLocal])

  return useCallback(
    (address, chainId, preferredName) => {
      if (preferredName) return preferredName
      if (!chainId) return ''
      const localThisChain = localByKey.get(addressBookKey(address, chainId))
      if (source === 'localOnly') return localThisChain ?? ''
      const spaceName = getFromSpaceByAddress(address)?.name
      if (source === 'spaceOnly') return spaceName ?? ''
      // merged: space (any chain) > local (this chain) > local (any chain)
      return spaceName ?? localThisChain ?? localByAddress.get(address.toLowerCase()) ?? ''
    },
    [getFromSpaceByAddress, source, localByKey, localByAddress],
  )
}

// Returns all local address books
const useAllAddressBooks = () => useAppSelector(selectAllAddressBooks)

export default useAllAddressBooks
