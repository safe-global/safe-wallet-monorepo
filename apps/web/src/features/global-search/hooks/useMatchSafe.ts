import { useCallback } from 'react'
import { isMultiChainSafeItem, type AllSafeItems } from '@/hooks/safes'
import { useAppSelector } from '@/store'
import { selectAllAddressBooks } from '@/store/addressBookSlice'

/**
 * Returns a memoized callback that matches a Safe by address or name.
 * Falls back to addressBooks for the name when the Safe item has no name.
 */
const useMatchSafe = () => {
  const addressBooks = useAppSelector(selectAllAddressBooks)

  return useCallback(
    (safe: AllSafeItems[number], q: string): boolean => {
      const address = safe.address.toLowerCase()
      const safeName =
        safe.name ?? addressBooks[isMultiChainSafeItem(safe) ? safe.safes[0].chainId : safe.chainId]?.[safe.address]
      return address.includes(q) || (safeName?.toLowerCase().includes(q) ?? false)
    },
    [addressBooks],
  )
}

export default useMatchSafe
