import { useEffect, useMemo } from 'react'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3ReadOnly'
import { createWeb3ReadOnly } from '@/hooks/wallets/web3'
import { useChain, useCurrentChain } from '@/hooks/useChains'
import { useAppSelector } from '@/store'
import { selectRpc } from '@/store/settingsSlice'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { isDomain, resolveNameForChain } from '@/services/ens'
import useDebounce from '@safe-global/utils/hooks/useDebounce'
import { getEnsHubChainId } from '@safe-global/utils/utils/ens'

// Shown when the user enters an ENS-style name that can't be resolved to an address on the chain it
// was looked up for — either because that chain has no domain lookup hub, or the name isn't set.
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

  // Target chain whose address record we want (e.g. Base Safe, or mainnet for Spaces contacts).
  const targetChain = chain ?? currentChain
  const hubChainId = targetChain ? getEnsHubChainId(!!targetChain.isTestnet) : undefined
  const hubChain = useChain(hubChainId || '')

  // ENSv2: resolution always starts on the hub (Mainnet / Sepolia Universal Resolver), not the L2 RPC.
  const needsOwnProvider = !!hubChain && hubChain.chainId !== currentChain?.chainId
  const ownProvider = useMemo(
    () => (needsOwnProvider && hubChain ? createWeb3ReadOnly(hubChain, customRpc?.[hubChain.chainId]) : undefined),
    [needsOwnProvider, hubChain, customRpc],
  )
  useEffect(() => () => ownProvider?.destroy(), [ownProvider])

  const ethersProvider = needsOwnProvider ? ownProvider : globalProvider
  const debouncedValue = useDebounce((value || '').trim(), 200)
  const targetChainId = targetChain ? Number(targetChain.chainId) : undefined

  const [ens, resolverError, isResolving] = useAsync<{ name: string; address: string } | undefined>(() => {
    if (!ethersProvider || !debouncedValue || !isDomain(debouncedValue) || targetChainId === undefined) return

    return resolveNameForChain(ethersProvider, debouncedValue, targetChainId).then((address) => {
      if (!address) throw Error(getEnsNotAvailableError(targetChain))
      return { name: debouncedValue, address }
    })
  }, [debouncedValue, ethersProvider, targetChain, targetChainId])

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
