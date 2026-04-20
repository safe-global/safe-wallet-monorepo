import { useCallback, useMemo } from 'react'
import { isMultiChainSafeItem, type AllSafeItems } from '@/hooks/safes'
import { useAppSelector } from '@/store'
import { selectAllAddressBooks } from '@/store/addressBookSlice'
import useChains from '@/hooks/useChains'

/**
 * Returns a memoized callback that matches a Safe by address, name, or chain.
 * Falls back to addressBooks for the name when the Safe item has no name.
 * Chain matching checks chainName (e.g. "Ethereum") and shortName (e.g. "eth", "sep").
 */
const useMatchSafe = () => {
  const addressBooks = useAppSelector(selectAllAddressBooks)
  const { configs: chains } = useChains()

  const chainLookup = useMemo(
    () =>
      new Map(
        chains.map((c) => [c.chainId, { chainName: c.chainName.toLowerCase(), shortName: c.shortName.toLowerCase() }]),
      ),
    [chains],
  )

  return useCallback(
    (safe: AllSafeItems[number], q: string): boolean => {
      const address = safe.address.toLowerCase()
      const safeName =
        safe.name ?? addressBooks[isMultiChainSafeItem(safe) ? safe.safes[0].chainId : safe.chainId]?.[safe.address]

      if (address.includes(q) || (safeName?.toLowerCase().includes(q) ?? false)) {
        return true
      }

      const chainIds = isMultiChainSafeItem(safe) ? safe.safes.map((s) => s.chainId) : [safe.chainId]
      return chainIds.some((id) => {
        const chain = chainLookup.get(id)
        return chain && (chain.chainName.includes(q) || chain.shortName.includes(q))
      })
    },
    [addressBooks, chainLookup],
  )
}

export default useMatchSafe
