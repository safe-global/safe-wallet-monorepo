import useAddressBook from '@/hooks/useAddressBook'
import { lookupAddress } from '@/services/ens'
import { useEffect, useMemo } from 'react'
import useAsync from '@safe-global/utils/hooks/useAsync'
import useDebounce from '@safe-global/utils/hooks/useDebounce'
import { useCurrentChain } from './useChains'
import { useEnsHubProvider } from './useEnsHubProvider'
import { ETH_COIN_TYPE } from '@safe-global/utils/utils/ens'

// Mainnet and Sepolia hubs are independent registries, so a primary name cached for one must not
// be served for the other. Keyed by hub and coin type (always ETH 60 today).
const cache: Record<string, Record<string, string>> = {}

export const useAddressResolver = (address?: string) => {
  const addressBook = useAddressBook()
  const currentChain = useCurrentChain()
  const debouncedValue = useDebounce(address, 200)
  const addressBookName = address && addressBook[address]

  // ENSv2: reverse lookups run on the shared hub provider (Mainnet/Sepolia Universal Resolver)
  const { hubChain, provider: ethersProvider, isDomainLookupEnabled } = useEnsHubProvider(currentChain)

  const shouldResolve = address && !addressBookName && isDomainLookupEnabled && !!ethersProvider && !!debouncedValue
  const cacheKey = `${hubChain?.chainId}:${ETH_COIN_TYPE}`

  const [ens, _, isResolving] = useAsync<string | undefined>(() => {
    if (!shouldResolve) return
    // Wait for debounce to settle so we never resolve a stale address
    if (debouncedValue !== address) return
    if (debouncedValue && cache[cacheKey]?.[debouncedValue]) {
      return Promise.resolve(cache[cacheKey][debouncedValue])
    }
    // Primary names live on the hub with ETH coin type 60
    return lookupAddress(ethersProvider, debouncedValue, ETH_COIN_TYPE)
  }, [ethersProvider, debouncedValue, shouldResolve, address, cacheKey])

  const resolving = (shouldResolve && isResolving) || false

  useEffect(() => {
    if (ens && debouncedValue) {
      cache[cacheKey] = cache[cacheKey] || {}
      cache[cacheKey][debouncedValue] = ens
    }
  }, [cacheKey, debouncedValue, ens])

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
