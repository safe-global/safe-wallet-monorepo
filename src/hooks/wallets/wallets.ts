import { CYPRESS_MNEMONIC, TREZOR_APP_URL, TREZOR_EMAIL, WC_PROJECT_ID } from '@/config/constants'
import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import type { InitOptions } from '@web3-onboard/core'
import coinbaseModule from '@web3-onboard/coinbase'
import injectedWalletModule from '@web3-onboard/injected-wallets'
import keystoneModule from '@web3-onboard/keystone/dist/index'

import ledgerModule from '@web3-onboard/ledger/dist/index'
import trezorModule from '@web3-onboard/trezor'
import walletConnect from '@web3-onboard/walletconnect'

import e2eWalletModule from '@/tests/e2e-wallet'
import { CGW_NAMES, WALLET_KEYS } from './consts'
import MpcModule from '@/services/mpc/SocialLoginModule'
import { SOCIAL_WALLET_OPTIONS } from '@/services/mpc/config'

const prefersDarkMode = (): boolean => {
  return window?.matchMedia('(prefers-color-scheme: dark)')?.matches
}

type WalletInits = InitOptions['wallets']
type WalletInit = WalletInits extends Array<infer U> ? U : never

const walletConnectV2 = (chain: ChainInfo) => {
  // WalletConnect v2 requires a project ID
  if (!WC_PROJECT_ID) {
    return () => null
  }

  return walletConnect({
    version: 2,
    projectId: WC_PROJECT_ID,
    qrModalOptions: {
      themeVariables: {
        '--wcm-z-index': '1302',
      },
      themeMode: prefersDarkMode() ? 'dark' : 'light',
    },
    requiredChains: [parseInt(chain.chainId)],
    dappUrl: location.origin,
  })
}

const WALLET_MODULES: { [key in WALLET_KEYS]: (chain: ChainInfo) => WalletInit } = {
  [WALLET_KEYS.INJECTED]: () => injectedWalletModule() as WalletInit,
  [WALLET_KEYS.WALLETCONNECT_V2]: (chain) => walletConnectV2(chain) as WalletInit,
  [WALLET_KEYS.COINBASE]: () => coinbaseModule({ darkMode: prefersDarkMode() }) as WalletInit,
  [WALLET_KEYS.SOCIAL]: (chain) => MpcModule(chain) as WalletInit,
  [WALLET_KEYS.LEDGER]: () => ledgerModule() as WalletInit,
  [WALLET_KEYS.TREZOR]: () => trezorModule({ appUrl: TREZOR_APP_URL, email: TREZOR_EMAIL }) as WalletInit,
  [WALLET_KEYS.KEYSTONE]: () => keystoneModule() as WalletInit,
}

export const getAllWallets = (chain: ChainInfo): WalletInits => {
  return Object.values(WALLET_MODULES).map((module) => module(chain))
}

export const isWalletSupported = (disabledWallets: string[], walletLabel: string): boolean => {
  const legacyWalletName = CGW_NAMES?.[walletLabel.toUpperCase() as WALLET_KEYS]
  return !disabledWallets.includes(legacyWalletName || walletLabel)
}

export const getSupportedWallets = (chain: ChainInfo): WalletInits => {
  if (window.Cypress && CYPRESS_MNEMONIC) {
    return [e2eWalletModule(chain.rpcUri) as WalletInit]
  }
  const enabledWallets = Object.entries(WALLET_MODULES).filter(([key]) => isWalletSupported(chain.disabledWallets, key))

  if (enabledWallets.length === 0) {
    return [WALLET_MODULES.INJECTED(chain)]
  }

  return enabledWallets.map(([, module]) => module(chain))
}

export const isSocialWalletEnabled = (chain: ChainInfo | undefined): boolean => {
  if (Object.keys(SOCIAL_WALLET_OPTIONS).length === 0) return false

  if (!chain) return false

  return chain.disabledWallets.every((label) => label !== CGW_NAMES.SOCIAL_LOGIN)
}
