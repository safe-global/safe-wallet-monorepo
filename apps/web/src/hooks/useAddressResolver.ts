import useAddressBook from '@/hooks/useAddressBook'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3ReadOnly'
import { createWeb3ReadOnly } from '@/hooks/wallets/web3'
import { lookupAddress } from '@/services/ens'
import { useEffect, useMemo } from 'react'
import useAsync from '@safe-global/utils/hooks/useAsync'
import useDebounce from '@safe-global/utils/hooks/useDebounce'
import { useChain, useCurrentChain } from './useChains'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import useChainId from './useChainId'
import { useAppSelector } from '@/store'
import { selectRpc } from '@/store/settingsSlice'
import { ETH_COIN_TYPE, getEnsHubChainId } from '@safe-global/utils/utils/ens'

const cache: Record<string, Record<string, string>> = {}

export const useAddressResolver = (address?: string) => {
  const addressBook = useAddressBook()
  const globalProvider = useWeb3ReadOnly()
  const currentChain = useCurrentChain()
  const customRpc = useAppSelector(selectRpc)
  const debouncedValue = useDebounce(address, 200)
  const addressBookName = address && addressBook[address]
  const chainId = useChainId()

  const hubChainId = currentChain ? getEnsHubChainId(!!currentChain.isTestnet) : undefined
  const hubChain = useChain(hubChainId || '')
  const isDomainLookupEnabled = !!hubChain && hasFeature(hubChain, FEATURES.DOMAIN_LOOKUP)

  const needsOwnProvider = !!hubChain && hubChain.chainId !== currentChain?.chainId
  const ownProvider = useMemo(
    () => (needsOwnProvider && hubChain ? createWeb3ReadOnly(hubChain, customRpc?.[hubChain.chainId]) : undefined),
    [needsOwnProvider, hubChain, customRpc],
  )
  useEffect(() => () => ownProvider?.destroy(), [ownProvider])

  const ethersProvider = needsOwnProvider ? ownProvider : globalProvider
  const shouldResolve = address && !addressBookName && isDomainLookupEnabled && !!ethersProvider && !!debouncedValue

  const [ens, _, isResolving] = useAsync<string | undefined>(() => {
    if (!shouldResolve) return
    // Wait for debounce to settle so we never resolve a stale address
    if (debouncedValue !== address) return
    if (chainId && debouncedValue && cache[chainId]?.[debouncedValue]) {
      return Promise.resolve(cache[chainId][debouncedValue])
    }
    // Primary names live on the hub with ETH coin type 60
    return lookupAddress(ethersProvider, debouncedValue, ETH_COIN_TYPE)
  }, [chainId, ethersProvider, debouncedValue, shouldResolve, address])

  const resolving = (shouldResolve && isResolving) || false

  // Cache resolved ENS names per Safe/target chain
  useEffect(() => {
    if (chainId && ens && debouncedValue) {
      cache[chainId] = cache[chainId] || {}
      cache[chainId][debouncedValue] = ens
    }
  }, [chainId, debouncedValue, ens])

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
