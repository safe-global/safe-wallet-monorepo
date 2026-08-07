import useAsync from '@safe-global/utils/hooks/useAsync'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { useChain } from '@/hooks/useChains'
import { useAppSelector } from '@/store'
import { selectRpc } from '@/store/settingsSlice'
import { lookupAddress } from '@/services/ens'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'

// ENS primary names live on Ethereum mainnet, so the connected wallet's name always resolves there
// regardless of which chain the wallet or the currently viewed Safe is on.
const ENS_CHAIN_ID = '1'

/**
 * Resolves the connected wallet's ENS name against Ethereum mainnet.
 *
 * Unlike `useAddressResolver`, this does not depend on the currently viewed Safe/route (the wallet
 * chip renders even when no Safe is open) nor on the wallet's connected chain (a testnet/L2 wallet
 * still has its primary name on mainnet). Returns `undefined` when mainnet has no domain lookup or
 * resolution fails (handled by `lookupAddress`).
 */
export const useWalletName = (wallet?: ConnectedWallet | null): string | undefined => {
  const chain = useChain(ENS_CHAIN_ID)
  const customRpc = useAppSelector(selectRpc)
  const address = wallet?.address
  const canResolve = !!chain && !!address && hasFeature(chain, FEATURES.DOMAIN_LOOKUP)

  const [ens] = useAsync<string | undefined>(async () => {
    if (!canResolve || !chain || !address) return undefined

    // Dynamic import to keep ethers out of the main bundle
    const { createWeb3ReadOnly } = await import('@/hooks/wallets/web3')
    const provider = createWeb3ReadOnly(chain, customRpc?.[chain.chainId])
    if (!provider) return undefined

    try {
      return await lookupAddress(provider, address)
    } finally {
      provider.destroy()
    }
  }, [canResolve, chain, customRpc, address])

  return ens
}
