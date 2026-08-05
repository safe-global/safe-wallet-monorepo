import { useMemo } from 'react'
import type { JsonRpcProvider } from 'ethers'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3ReadOnly'
import { createWeb3ReadOnly } from '@/hooks/wallets/web3'
import { useChain, useCurrentChain } from '@/hooks/useChains'
import { useAppSelector } from '@/store'
import { selectRpc } from '@/store/settingsSlice'
import { getEnsHubChainId } from '@safe-global/utils/utils/ens'

// One provider per hub RPC, shared by every consumer for the session. Idle JsonRpcProviders hold
// no timers or connections, so keeping them alive is cheaper than one provider per mounted hook.
const hubProviders: Record<string, JsonRpcProvider> = {}

const getSharedHubProvider = (chain: Chain, customRpc?: string): JsonRpcProvider | undefined => {
  const key = `${chain.chainId}:${customRpc ?? ''}`
  if (!hubProviders[key]) {
    const provider = createWeb3ReadOnly(chain, customRpc)
    if (!provider) return undefined
    hubProviders[key] = provider
  }
  return hubProviders[key]
}

// Test-only: the module-level provider cache would otherwise leak mocks between tests
export const _clearEnsHubProviders = (): void => {
  Object.keys(hubProviders).forEach((key) => delete hubProviders[key])
}

/**
 * Returns the ENSv2 hub chain (Mainnet/Sepolia Universal Resolver) for a target chain, and a
 * read-only provider for it. Reuses the app's global provider when the current chain is the hub.
 * Fails closed: when the hub chain is not in the loaded config, no provider is returned — ENS
 * resolution must not fall back to another chain's RPC.
 */
export const useEnsHubProvider = (
  targetChain?: Chain,
): { hubChain: Chain | undefined; provider: JsonRpcProvider | undefined } => {
  const globalProvider = useWeb3ReadOnly()
  const currentChain = useCurrentChain()
  const customRpc = useAppSelector(selectRpc)

  const hubChainId = targetChain ? getEnsHubChainId(!!targetChain.isTestnet) : undefined
  const hubChain = useChain(hubChainId || '')

  const provider = useMemo(() => {
    if (!hubChain) return undefined
    if (hubChain.chainId === currentChain?.chainId) return globalProvider
    return getSharedHubProvider(hubChain, customRpc?.[hubChain.chainId])
  }, [hubChain, currentChain?.chainId, globalProvider, customRpc])

  return useMemo(() => ({ hubChain, provider }), [hubChain, provider])
}
