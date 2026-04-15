import { useCallback, useMemo } from 'react'
import { isMultiChainSafeItem, type AllSafeItems } from '@/hooks/safes'
import { useAppSelector } from '@/store'
import { selectAllAddressBooks } from '@/store/addressBookSlice'
import useChains from '@/hooks/useChains'

/**
 * Returns a memoized callback that matches a Safe by address, name,
 * or chain-prefixed address (e.g. "matic:0xf452…").
 * Falls back to addressBooks for the name when the Safe item has no name.
 */
const useMatchSafe = () => {
  const addressBooks = useAppSelector(selectAllAddressBooks)
  const { configs } = useChains()

  const chainIdToShortName = useMemo(
    () => new Map(configs.map((chain) => [chain.chainId, chain.shortName.toLowerCase()])),
    [configs],
  )

  return useCallback(
    (safe: AllSafeItems[number], q: string): boolean => {
      const address = safe.address.toLowerCase()
      const safeName =
        safe.name ?? addressBooks[isMultiChainSafeItem(safe) ? safe.safes[0].chainId : safe.chainId]?.[safe.address]

      if (address.includes(q) || (safeName?.toLowerCase().includes(q) ?? false)) {
        return true
      }

      // Match chain-prefixed addresses (e.g. "matic:0xf452…" or just "matic:")
      const chainIds = isMultiChainSafeItem(safe) ? safe.safes.map((s) => s.chainId) : [safe.chainId]
      return chainIds.some((chainId) => {
        const shortName = chainIdToShortName.get(chainId)
        if (!shortName) return false
        const prefixed = `${shortName}:${address}`
        return prefixed.includes(q)
      })
    },
    [addressBooks, chainIdToShortName],
  )
}

export default useMatchSafe
