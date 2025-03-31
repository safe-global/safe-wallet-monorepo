import useAddressBook from '@/hooks/useAddressBook'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import { lookupAddress } from '@/services/ens'
import { useMemo } from 'react'
import useAsync from '@/hooks/useAsync'
import useDebounce from './useDebounce'
import { useHasFeature } from './useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'

export const useAddressResolver = (address: string) => {
  const addressBook = useAddressBook()
  const ethersProvider = useWeb3ReadOnly()
  const debouncedValue = useDebounce(address, 200)
  const addressBookName = addressBook[address]
  const isDomainLookupEnabled = useHasFeature(FEATURES.DOMAIN_LOOKUP)
  const shouldResolve = !addressBookName && isDomainLookupEnabled && !!ethersProvider && !!debouncedValue

  const [ens, _, isResolving] = useAsync<string | undefined>(() => {
    if (!shouldResolve) return
    return lookupAddress(ethersProvider, debouncedValue)
  }, [ethersProvider, debouncedValue, shouldResolve])

  const resolving = shouldResolve && isResolving

  return useMemo(
    () => ({
      ens,
      name: addressBookName,
      resolving,
    }),
    [ens, addressBookName, resolving],
  )
}
