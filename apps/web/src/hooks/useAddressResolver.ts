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

  const canResolve = !!address && !addressBookName && isDomainLookupEnabled && !!ethersProvider
  const shouldResolve = canResolve && !!debouncedValue
  const cacheKey = `${hubChain?.chainId}:${ETH_COIN_TYPE}`

  const [lookup] = useAsync<{ address: string; cacheKey: string; ens: string | undefined } | undefined>(() => {
    if (!shouldResolve) return
    // Wait for debounce to settle so we never resolve a stale address
    if (debouncedValue !== address) return
    const cached = cache[cacheKey]?.[debouncedValue]
    // Primary names live on the hub with ETH coin type 60
    const ensLookup = cached ? Promise.resolve(cached) : lookupAddress(ethersProvider, debouncedValue, ETH_COIN_TYPE)
    return ensLookup.then((ens) => ({ address: debouncedValue, cacheKey, ens }))
  }, [ethersProvider, debouncedValue, shouldResolve, address, cacheKey])

  // Resolving until this address has a result from this hub; a gated form must not submit sooner
  const settledLookup = lookup?.address === address && lookup?.cacheKey === cacheKey ? lookup : undefined
  const ens = settledLookup?.ens
  const resolving = canResolve && !settledLookup

  useEffect(() => {
    if (lookup?.ens) {
      cache[lookup.cacheKey] = cache[lookup.cacheKey] || {}
      cache[lookup.cacheKey][lookup.address] = lookup.ens
    }
  }, [lookup])

  return useMemo(
    () => ({
      ens,
      name: addressBookName,
      resolving,
    }),
    [ens, addressBookName, resolving],
  )
}
