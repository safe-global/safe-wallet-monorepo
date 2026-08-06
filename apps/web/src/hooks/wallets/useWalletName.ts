import useAsync from '@safe-global/utils/hooks/useAsync'
import { useChain } from '@/hooks/useChains'
import { useAppSelector } from '@/store'
import { selectRpc } from '@/store/settingsSlice'
import { lookupAddress } from '@/services/ens'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import { ETH_COIN_TYPE, getEnsHubChainId, hasHubDomainLookup } from '@safe-global/utils/utils/ens'

/**
 * Resolves the connected wallet's ENS primary name against the ENS hub (Ethereum mainnet).
 *
 * Unlike `useAddressResolver`, this does not depend on the currently viewed Safe/route (the wallet
 * chip renders even when no Safe is open) nor on the wallet's connected chain (a testnet/L2 wallet
 * still has its primary name on mainnet). Returns `undefined` when mainnet has no domain lookup or
 * resolution fails (handled by `lookupAddress`).
 */
export const useWalletName = (wallet?: ConnectedWallet | null): string | undefined => {
  // Wallet primary names are production ENS records on mainnet, not testnet hubs.
  const chain = useChain(getEnsHubChainId(false))
  const customRpc = useAppSelector(selectRpc)
  const address = wallet?.address
  const canResolve = hasHubDomainLookup(chain) && !!address

  const [ens] = useAsync<string | undefined>(async () => {
    if (!canResolve || !chain || !address) return undefined

    // Dynamic import to keep ethers out of the main bundle
    const { createWeb3ReadOnly } = await import('@/hooks/wallets/web3')
    const provider = createWeb3ReadOnly(chain, customRpc?.[chain.chainId])
    if (!provider) return undefined

    try {
      return await lookupAddress(provider, address, ETH_COIN_TYPE)
    } finally {
      provider.destroy()
    }
  }, [canResolve, chain, customRpc, address])

  return ens
}
