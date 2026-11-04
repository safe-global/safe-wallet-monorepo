import { useMemo } from 'react'
import type { JsonRpcProvider } from 'ethers'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3ReadOnly'
import { getSharedReadOnlyProvider } from '@/hooks/wallets/sharedReadOnlyProvider'
import { useChain, useCurrentChain } from '@/hooks/useChains'
import { useAppSelector } from '@/store'
import { selectRpc } from '@/store/settingsSlice'
import { getEnsHubChainId, hasHubDomainLookup } from '@safe-global/utils/utils/ens'

// Fails closed when the hub chain is missing from config: ENS must never fall back to another RPC.
export const useEnsHubProvider = (
  targetChain?: Chain,
): { hubChain: Chain | undefined; provider: JsonRpcProvider | undefined; isDomainLookupEnabled: boolean } => {
  const globalProvider = useWeb3ReadOnly()
  const currentChain = useCurrentChain()
  const customRpc = useAppSelector(selectRpc)

  const hubChainId = targetChain ? getEnsHubChainId(!!targetChain.isTestnet) : undefined
  const hubChain = useChain(hubChainId || '')

  const provider = useMemo(() => {
    if (!hubChain) return undefined
    if (hubChain.chainId === currentChain?.chainId) return globalProvider
    return getSharedReadOnlyProvider(hubChain, customRpc?.[hubChain.chainId])
  }, [hubChain, currentChain?.chainId, globalProvider, customRpc])

  const isDomainLookupEnabled = hasHubDomainLookup(hubChain)

  return useMemo(() => ({ hubChain, provider, isDomainLookupEnabled }), [hubChain, provider, isDomainLookupEnabled])
}
