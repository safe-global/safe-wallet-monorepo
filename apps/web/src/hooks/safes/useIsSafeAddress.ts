import { useMemo } from 'react'
import useAllSafes from './useAllSafes'

/**
 * Returns a resolver that tells whether a given address is a Safe account known to the
 * current workspace (added, owned or undeployed safes across all chains).
 *
 * Use this to tag address book entries and recipient suggestions that are themselves Safes,
 * so users can recognise Safe-to-Safe transfers. It returns a function rather than a boolean so
 * it can be reused across many addresses (e.g. a table or autocomplete) with a single hook call.
 *
 * When `chainId` is provided the match is chain-specific; otherwise it matches on any chain.
 */
const useGetIsSafeAddress = (): ((address: string, chainId?: string) => boolean) => {
  const allSafes = useAllSafes()

  return useMemo(() => {
    const byChain = new Set<string>()
    const anyChain = new Set<string>()

    for (const safe of allSafes ?? []) {
      const lower = safe.address.toLowerCase()
      byChain.add(`${safe.chainId}:${lower}`)
      anyChain.add(lower)
    }

    return (address: string, chainId?: string): boolean => {
      if (!address) return false
      const lower = address.toLowerCase()
      return chainId ? byChain.has(`${chainId}:${lower}`) : anyChain.has(lower)
    }
  }, [allSafes])
}

export default useGetIsSafeAddress
