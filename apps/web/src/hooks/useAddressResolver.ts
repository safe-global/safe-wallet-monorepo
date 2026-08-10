import useAddressBook from '@/hooks/useAddressBook'
import { lookupAddress } from '@/services/ens'
import { useEffect, useMemo } from 'react'
import useAsync from '@safe-global/utils/hooks/useAsync'
import useDebounce from '@safe-global/utils/hooks/useDebounce'
import { useCurrentChain } from './useChains'
import { useEnsHubProvider } from './useEnsHubProvider'
import { ETH_COIN_TYPE } from '@safe-global/utils/utils/ens'

// Reverse lookups are coin-type scoped (currently always ETH 60 on the hub). Key by coin type so
// a future ENSIP-19 per-chain reverse does not reuse the wrong primary name.
const cache: Record<string, Record<string, string>> = {}

export const useAddressResolver = (address?: string) => {
  const addressBook = useAddressBook()
  const currentChain = useCurrentChain()
  const debouncedValue = useDebounce(address, 200)
  const addressBookName = address && addressBook[address]

  // ENSv2: reverse lookups run on the shared hub provider (Mainnet/Sepolia Universal Resolver)
  const { provider: ethersProvider, isDomainLookupEnabled } = useEnsHubProvider(currentChain)

  const shouldResolve = address && !addressBookName && isDomainLookupEnabled && !!ethersProvider && !!debouncedValue
  const coinTypeKey = String(ETH_COIN_TYPE)

  const [ens, _, isResolving] = useAsync<string | undefined>(() => {
    if (!shouldResolve) return
    // Wait for debounce to settle so we never resolve a stale address
    if (debouncedValue !== address) return
    if (debouncedValue && cache[coinTypeKey]?.[debouncedValue]) {
      return Promise.resolve(cache[coinTypeKey][debouncedValue])
    }
    // Primary names live on the hub with ETH coin type 60
    return lookupAddress(ethersProvider, debouncedValue, ETH_COIN_TYPE)
  }, [ethersProvider, debouncedValue, shouldResolve, address, coinTypeKey])

  const resolving = (shouldResolve && isResolving) || false

  useEffect(() => {
    if (ens && debouncedValue) {
      cache[coinTypeKey] = cache[coinTypeKey] || {}
      cache[coinTypeKey][debouncedValue] = ens
    }
  }, [coinTypeKey, debouncedValue, ens])

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
