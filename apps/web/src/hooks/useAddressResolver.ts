import useAddressBook from '@/hooks/useAddressBook'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3ReadOnly'
import { lookupAddress } from '@/services/ens'
import { useMemo } from 'react'
import { isAddress } from 'ethers'
import useAsync from '@safe-global/utils/hooks/useAsync'
import useDebounce from '@safe-global/utils/hooks/useDebounce'
import { useHasFeature } from './useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import useChainId from './useChainId'

const cache = new Map<string, Map<string, string | null>>()

export const useAddressResolver = (address?: string) => {
  const addressBook = useAddressBook()
  const ethersProvider = useWeb3ReadOnly()
  const debouncedValue = useDebounce(address, 200)
  const addressBookName = address && addressBook[address]
  const isDomainLookupEnabled = useHasFeature(FEATURES.DOMAIN_LOOKUP)
  const shouldResolve = address && !addressBookName && isDomainLookupEnabled && !!ethersProvider && !!debouncedValue
  const chainId = useChainId()

  const [ens, _, isResolving] = useAsync<string | undefined>(async () => {
    if (!shouldResolve) return
    // Wait for debounce to settle so we never resolve a stale address
    if (debouncedValue !== address) return
    // Only look up valid hex addresses; prevents caching arbitrary user input
    if (!isAddress(debouncedValue)) return
    if (!chainId) return
    const chainCache = cache.get(chainId)
    if (chainCache?.has(debouncedValue)) {
      return chainCache.get(debouncedValue) ?? undefined
    }
    try {
      const result = await lookupAddress(ethersProvider, debouncedValue)
      const entries = cache.get(chainId) ?? new Map<string, string | null>()
      entries.set(debouncedValue, result ?? null)
      cache.set(chainId, entries)
      return result
    } catch {
      // Do not cache transient RPC failures — retry on next mount
      return undefined
    }
  }, [chainId, ethersProvider, debouncedValue, shouldResolve, address])

  const resolving = (shouldResolve && isResolving) || false

  // Clear stale ENS while debounce catches up to the new address
  const isStale = debouncedValue !== address

  return useMemo(
    () => ({
      ens: isStale ? undefined : ens,
      name: addressBookName,
      resolving,
    }),
    [ens, addressBookName, resolving, isStale],
  )
}
