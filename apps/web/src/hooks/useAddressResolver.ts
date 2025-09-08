import useAddressBook from '@/hooks/useAddressBook'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import { lookupAddress } from '@/services/ens'
import { useEffect, useMemo } from 'react'
import useAsync from '@safe-global/utils/hooks/useAsync'
import useDebounce from './useDebounce'
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
  const shouldResolve = address && !addressBookName && isDomainLookupEnabled && !!ethersProvider && !!debouncedValue
  const chainId = useChainId()

  const [ens, _, isResolving] = useAsync<string | undefined>(() => {
    if (!shouldResolve) return
    if (chainId && debouncedValue && cache[chainId]?.[debouncedValue]) {
      return Promise.resolve(cache[chainId][debouncedValue])
    }
    return lookupAddress(ethersProvider, debouncedValue)
  }, [chainId, ethersProvider, debouncedValue, shouldResolve])

  const resolving = (shouldResolve && isResolving) || false

  // Cache resolved ENS names per chain
  useEffect(() => {
    if (chainId && ens && debouncedValue) {
      cache[chainId] = cache[chainId] || {}
      cache[chainId][debouncedValue] = ens
    }
  }, [chainId, debouncedValue, ens])

  return useMemo(
    () => ({
      ens,
      name: addressBookName,
      resolving,
    }),
    [ens, addressBookName, resolving],
  )
}
