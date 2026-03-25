import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import { useGetBatchEnsNamesQuery } from '@/store/api/gateway'
import { type AllSafeItems, isMultiChainSafeItem } from '@/hooks/safes'
import { selectAllAddressBooks } from '@/store/addressBookSlice'
import { useAppSelector } from '@/store'

type EnsNamesMap = Record<string, string | null>

const EnsNamesContext = createContext<EnsNamesMap>({})

/**
 * Collect unique addresses from safe items that don't have an address book name.
 * Only these addresses need ENS resolution.
 */
function getAddressesNeedingEns(safes: AllSafeItems, addressBooks: Record<string, Record<string, string>>): string[] {
  const seen = new Set<string>()

  for (const item of safes) {
    const address = item.address
    if (seen.has(address)) continue

    // Check if any chain's address book has a name for this address
    const hasAddressBookName = isMultiChainSafeItem(item)
      ? item.safes.some((s) => addressBooks[s.chainId]?.[address])
      : !!addressBooks[item.chainId]?.[address]

    if (!hasAddressBookName) {
      seen.add(address)
    }
  }

  return Array.from(seen)
}

/**
 * Provider that fetches ENS names for all safe items in batch.
 * Wrap the accounts list with this provider.
 */
export function EnsNamesProvider({ safes, children }: { safes: AllSafeItems; children: ReactNode }) {
  const addressBooks = useAppSelector(selectAllAddressBooks)

  const addresses = useMemo(() => getAddressesNeedingEns(safes, addressBooks), [safes, addressBooks])

  // Sort to keep a stable cache key for RTK Query
  const sortedAddresses = useMemo(() => [...addresses].sort(), [addresses])

  const { data: ensNames } = useGetBatchEnsNamesQuery(sortedAddresses.length > 0 ? sortedAddresses : skipToken)

  const value = ensNames ?? {}

  return <EnsNamesContext.Provider value={value}>{children}</EnsNamesContext.Provider>
}

/**
 * Look up the ENS name for an address from the batch query results.
 * Returns the ENS name string, or undefined if not resolved.
 */
export function useEnsName(address: string): string | undefined {
  const ensNames = useContext(EnsNamesContext)
  return ensNames[address] ?? undefined
}
