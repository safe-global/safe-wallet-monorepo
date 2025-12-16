import useAddressBook from '@/hooks/useAddressBook'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import { lookupAddress } from '@/services/ens'
import { reverseResolveUnstoppable } from '@/services/ud'
import { useEffect, useMemo } from 'react'
import useAsync from '@safe-global/utils/hooks/useAsync'
import useDebounce from '@safe-global/utils/hooks/useDebounce'
import { useHasFeature } from './useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import useChainId from './useChainId'

const cache: Record<string, Record<string, string>> = {}

export const useAddressResolver = (address?: string) => {
  const addressBook = useAddressBook()
  const ethersProvider = useWeb3ReadOnly()
  const debouncedValue = useDebounce(address, 200)
  const addressBookName = address && addressBook[address]
  const isDomainLookupEnabled = useHasFeature(FEATURES.DOMAIN_LOOKUP)
  const shouldResolve = address && !addressBookName && isDomainLookupEnabled && !!debouncedValue
  const chainId = useChainId()

  const [domainName, _, isResolving] = useAsync<string | undefined>(async () => {
    if (!shouldResolve) return
    if (chainId && debouncedValue && cache[chainId]?.[debouncedValue]) {
      return Promise.resolve(cache[chainId][debouncedValue])
    }

    // Try ENS first if provider available
    if (ethersProvider) {
      try {
        const ensName = await lookupAddress(ethersProvider, debouncedValue)
        if (ensName) return ensName
      } catch (_) {
        // Continue to UD
      }
    }

    // Try UD reverse resolution
    const udName = await reverseResolveUnstoppable(debouncedValue)
    return udName
  }, [chainId, ethersProvider, debouncedValue, shouldResolve])

  const resolving = (shouldResolve && isResolving) || false

  // Cache resolved domain names (ENS or UD) per chain
  useEffect(() => {
    if (chainId && domainName && debouncedValue) {
      cache[chainId] = cache[chainId] || {}
      cache[chainId][debouncedValue] = domainName
    }
  }, [chainId, debouncedValue, domainName])

  return useMemo(
    () => ({
      ens: domainName,
      name: addressBookName,
      resolving,
    }),
    [domainName, addressBookName, resolving],
  )
}
