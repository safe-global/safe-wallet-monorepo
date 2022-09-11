import { FORTMATIC_KEY, PORTIS_KEY, TREZOR_APP_URL, TREZOR_EMAIL, WC_BRIDGE } from '@/config/constants'
import { type RecommendedInjectedWallets, type WalletInit } from '@web3-onboard/common/dist/types.d'

import coinbaseModule from '@web3-onboard/coinbase'
import fortmaticModule from '@web3-onboard/fortmatic'
import injectedWalletModule from '@web3-onboard/injected-wallets'
import keystoneModule from '@web3-onboard/keystone/dist/index'
import ledgerModule from '@web3-onboard/ledger'
import portisModule from '@web3-onboard/portis'
import torusModule from '@web3-onboard/torus'
import trezorModule from '@web3-onboard/trezor'
import walletConnect from '@web3-onboard/walletconnect'

import pairingModule, { PAIRING_MODULE_LABEL } from '@/services/pairing/module'
import { type ConnectedWallet } from '@/hooks/wallets/useOnboard'

export const enum WALLET_KEYS {
  COINBASE = 'COINBASE',
  FORTMATIC = 'FORTMATIC',
  INJECTED = 'INJECTED',
  KEYSTONE = 'KEYSTONE',
  LEDGER = 'LEDGER',
  PAIRING = 'PAIRING',
  PORTIS = 'PORTIS',
  TORUS = 'TORUS',
  TREZOR = 'TREZOR',
  WALLETCONNECT = 'WALLETCONNECT',
}

export const CGW_NAMES: { [key in WALLET_KEYS]: string | undefined } = {
  [WALLET_KEYS.COINBASE]: 'coinbase',
  [WALLET_KEYS.FORTMATIC]: 'fortmatic',
  [WALLET_KEYS.INJECTED]: 'detectedwallet',
  [WALLET_KEYS.KEYSTONE]: 'keystone',
  [WALLET_KEYS.LEDGER]: 'ledger',
  [WALLET_KEYS.PAIRING]: 'safeMobile',
  [WALLET_KEYS.PORTIS]: 'portis',
  [WALLET_KEYS.TORUS]: 'torus',
  [WALLET_KEYS.TREZOR]: 'trezor',
  [WALLET_KEYS.WALLETCONNECT]: 'walletConnect',
}

const WALLET_MODULES: { [key in WALLET_KEYS]: () => WalletInit } = {
  [WALLET_KEYS.INJECTED]: injectedWalletModule,
  [WALLET_KEYS.PAIRING]: pairingModule,
  [WALLET_KEYS.WALLETCONNECT]: () => walletConnect({ bridge: WC_BRIDGE }),
  [WALLET_KEYS.LEDGER]: ledgerModule,
  [WALLET_KEYS.TREZOR]: () => trezorModule({ appUrl: TREZOR_APP_URL, email: TREZOR_EMAIL }),
  [WALLET_KEYS.KEYSTONE]: keystoneModule,
  [WALLET_KEYS.COINBASE]: () =>
    coinbaseModule({ darkMode: !!window?.matchMedia('(prefers-color-scheme: dark)')?.matches }),
  [WALLET_KEYS.FORTMATIC]: () => fortmaticModule({ apiKey: FORTMATIC_KEY }),
  [WALLET_KEYS.PORTIS]: () => portisModule({ apiKey: PORTIS_KEY }),
  [WALLET_KEYS.TORUS]: torusModule,
}

export const getAllWallets = (): WalletInit[] => {
  return Object.values(WALLET_MODULES).map((module) => module())
}

export const getRecommendedInjectedWallets = (): RecommendedInjectedWallets[] => {
  return [{ name: 'MetaMask', url: 'https://metamask.io' }]
}

export const isWalletSupported = (disabledWallets: string[], walletLabel: string): boolean => {
  const legacyWalletName = CGW_NAMES?.[walletLabel.toUpperCase() as WALLET_KEYS]
  return !disabledWallets.includes(legacyWalletName || walletLabel)
}

export const getSupportedWallets = (disabledWallets: string[]): WalletInit[] => {
  return Object.entries(WALLET_MODULES)
    .filter(([key]) => isWalletSupported(disabledWallets, key))
    .map(([, module]) => module())
}

export const isHardwareWallet = (wallet: ConnectedWallet): boolean => {
  return [WALLET_KEYS.LEDGER, WALLET_KEYS.TREZOR].includes(wallet.label.toUpperCase() as WALLET_KEYS)
}

export const isSafeMobileWallet = (wallet: ConnectedWallet): boolean => {
  return wallet.label === PAIRING_MODULE_LABEL
}
