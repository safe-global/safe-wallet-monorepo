import { useMemo } from 'react'
import { useAppSelector } from '@/store'
import { selectAllAddressBooks } from '@/store/addressBookSlice'

/**
 * Returns a Map of `address (lowercase) → name` built from the user's address books
 * across all chains. Used by the onboarding side-panel mockup to show meaningful
 * Safe names — useSpaceSafes() only carries names from the Space's own address book,
 * which is usually empty for freshly-added safes.
 */
export const useSafeNameLookup = (): Map<string, string> => {
  const allAddressBooks = useAppSelector(selectAllAddressBooks)

  return useMemo(() => {
    const map = new Map<string, string>()
    if (!allAddressBooks) return map

    for (const chainId of Object.keys(allAddressBooks)) {
      const book = allAddressBooks[chainId] ?? {}
      for (const [address, name] of Object.entries(book)) {
        if (typeof name === 'string' && name.trim()) {
          const key = address.toLowerCase()
          if (!map.has(key)) map.set(key, name)
        }
      }
    }

    return map
  }, [allAddressBooks])
}
