import useAsync from '@safe-global/utils/hooks/useAsync'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { lookupAddress } from '@/services/ens'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import { useEnsHubProvider } from '@/hooks/useEnsHubProvider'
import { ENS_HUB_MAINNET, ETH_COIN_TYPE } from '@safe-global/utils/utils/ens'

// Wallet primary names are production ENS records on mainnet, not testnet hubs.
const MAINNET_ENS_TARGET = { chainId: ENS_HUB_MAINNET, isTestnet: false } as Chain

/**
 * Resolves the connected wallet's ENS primary name against the ENS hub (Ethereum mainnet).
 *
 * Unlike `useAddressResolver`, this does not depend on the currently viewed Safe/route (the wallet
 * chip renders even when no Safe is open) nor on the wallet's connected chain (a testnet/L2 wallet
 * still has its primary name on mainnet). Returns `undefined` when mainnet has no domain lookup or
 * resolution fails (handled by `lookupAddress`).
 */
export const useWalletName = (wallet?: ConnectedWallet | null): string | undefined => {
  const { provider, isDomainLookupEnabled } = useEnsHubProvider(MAINNET_ENS_TARGET)
  const address = wallet?.address
  const canResolve = isDomainLookupEnabled && !!provider && !!address

  const [ens] = useAsync<string | undefined>(() => {
    if (!canResolve || !provider || !address) return
    return lookupAddress(provider, address, ETH_COIN_TYPE)
  }, [canResolve, provider, address])

  return ens
}
