import { useMemo } from 'react'
import { useAppSelector } from '@/store'
import { selectAllAddressBooks } from '@/store/addressBookSlice'

// useSpaceSafes names are usually empty; this fills in from the user's global address books.
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
