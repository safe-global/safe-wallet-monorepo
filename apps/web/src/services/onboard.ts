import Onboard, { type OnboardAPI } from '@web3-onboard/core'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { getAllWallets } from '@/hooks/wallets/wallets'
import { getRpcServiceUrl } from '@/hooks/wallets/web3'
import { numberToHex } from '@/utils/hex'
import { BRAND_NAME } from '@/config/constants'
import type { EnvState } from '@safe-global/store/settingsSlice'

let onboard: OnboardAPI | null = null

export const createOnboard = (
  chainConfigs: Chain[],
  currentChain: Chain,
  rpcConfig: EnvState['rpc'] | undefined,
): OnboardAPI => {
  if (onboard) {
    console.log('[CreateOnboard] Returning existing onboard instance')
    return onboard
  }

  console.log('[CreateOnboard] Creating new onboard instance for chain:', currentChain.chainName)
  const wallets = getAllWallets(currentChain)
  console.log('[CreateOnboard] Loaded', wallets.length, 'wallet modules')

  const chains = chainConfigs.map((cfg) => ({
    // We cannot use ethers' toBeHex here as we do not want to pad it to an even number of characters.
    id: numberToHex(parseInt(cfg.chainId)),
    label: cfg.chainName,
    rpcUrl: rpcConfig?.[cfg.chainId] || getRpcServiceUrl(cfg.rpcUri as any),
    token: cfg.nativeCurrency.symbol,
    color: cfg.theme.backgroundColor,
    publicRpcUrl: cfg.publicRpcUri.value,
    blockExplorerUrl: new URL(cfg.blockExplorerUriTemplate.address).origin,
  }))

  console.log('[CreateOnboard] Configuring', chains.length, 'chains')

  try {
    onboard = Onboard({
      wallets,

      chains,

      accountCenter: {
        mobile: { enabled: false },
        desktop: { enabled: false },
      },

      notify: {
        enabled: false,
      },

      appMetadata: {
        name: BRAND_NAME,
        icon: location.origin + '/images/logo-round.svg',
        description: `${BRAND_NAME} – smart contract wallet for Ethereum (ex-Gnosis Safe multisig)`,
      },

      connect: {
        removeWhereIsMyWalletWarning: true,
        autoConnectLastWallet: false,
      },
    })

    console.log('[CreateOnboard] Onboard instance created successfully')
    return onboard
  } catch (e) {
    console.error('[CreateOnboard] Error creating onboard instance:', e)
    throw e
  }
}
