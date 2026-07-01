import { useEffect, useMemo } from 'react'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3ReadOnly'
import { createWeb3ReadOnly } from '@/hooks/wallets/web3'
import { useCurrentChain } from '@/hooks/useChains'
import { useAppSelector } from '@/store'
import { selectRpc } from '@/store/settingsSlice'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { isDomain, resolveName } from '@/services/ens'
import useDebounce from '@safe-global/utils/hooks/useDebounce'

// Shown when the user enters an ENS-style name that can't be resolved to an address on the chain it
// was looked up on — either because that chain has no domain lookup, or the name isn't set there.
// Names the chain (e.g. "Ethereum" in the chain-agnostic Spaces address book) so it isn't ambiguous.
export const getEnsNotAvailableError = (chain?: Chain): string =>
  `ENS name not available on ${chain?.chainName || 'this network'}`

const useNameResolver = (
  value?: string,
  chain?: Chain,
): { address: string | undefined; name: string | undefined; resolverError?: Error; resolving: boolean } => {
  const globalProvider = useWeb3ReadOnly()
  const currentChain = useCurrentChain()
  const customRpc = useAppSelector(selectRpc)

  // ENS lives on a specific chain. When the field resolves against a chain other than the app's
  // current one — e.g. the chain-agnostic Spaces address book resolves names on mainnet — use a
  // dedicated read-only provider for it, since the global provider follows the connected chain.
  const needsOwnProvider = !!chain && chain.chainId !== currentChain?.chainId
  const ownProvider = useMemo(
    () => (needsOwnProvider && chain ? createWeb3ReadOnly(chain, customRpc?.[chain.chainId]) : undefined),
    [needsOwnProvider, chain, customRpc],
  )
  useEffect(() => () => ownProvider?.destroy(), [ownProvider])

  const ethersProvider = needsOwnProvider ? ownProvider : globalProvider
  const debouncedValue = useDebounce((value || '').trim(), 200)

  // Fetch an ENS resolution for the current address
  const [ens, resolverError, isResolving] = useAsync<{ name: string; address: string } | undefined>(() => {
    if (!ethersProvider || !debouncedValue || !isDomain(debouncedValue)) return

    return resolveName(ethersProvider, debouncedValue).then((address) => {
      if (!address) throw Error(getEnsNotAvailableError(chain ?? currentChain))
      return { name: debouncedValue, address }
    })
  }, [debouncedValue, ethersProvider, chain, currentChain])

  const resolving = isResolving && !!ethersProvider && !!debouncedValue
  const resolved = ens && ens.name === value ? ens : undefined

  return useMemo(
    () => ({
      address: resolved?.address,
      name: resolved?.name,
      resolverError,
      resolving,
    }),
    [resolved, resolverError, resolving],
  )
}

export default useNameResolver
