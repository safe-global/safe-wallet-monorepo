import Onboard, { type OnboardAPI } from '@web3-onboard/core'
import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { getAllWallets } from '@/hooks/wallets/wallets'
import { getRpcServiceUrl } from '@/hooks/wallets/web3'
import { numberToHex } from '@/utils/hex'
import { BRAND_NAME } from '@/config/constants'
import type { EnvState } from '@safe-global/store/settingsSlice'

let onboard: OnboardAPI | null = null

export const createOnboard = (
  chainConfigs: ChainInfo[],
  currentChain: ChainInfo,
  rpcConfig: EnvState['rpc'] | undefined,
): OnboardAPI => {
  if (onboard) return onboard

  const wallets = getAllWallets(currentChain)

  const chains = chainConfigs.map((cfg) => ({
    // We cannot use ethers' toBeHex here as we do not want to pad it to an even number of characters.
    id: numberToHex(parseInt(cfg.chainId)),
    label: cfg.chainName,
    rpcUrl: rpcConfig?.[cfg.chainId] || getRpcServiceUrl(cfg.rpcUri),
    token: cfg.nativeCurrency.symbol,
    color: cfg.theme.backgroundColor,
    publicRpcUrl: cfg.publicRpcUri.value,
    blockExplorerUrl: new URL(cfg.blockExplorerUriTemplate.address).origin,
  }))

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

  return onboard
}
