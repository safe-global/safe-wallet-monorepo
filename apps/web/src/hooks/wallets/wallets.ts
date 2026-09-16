import { WC_PROJECT_ID } from '@/config/constants'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { InitOptions } from '@web3-onboard/core'
import coinbaseModule from '@web3-onboard/coinbase'
import injectedWalletModule from '@web3-onboard/injected-wallets'
import walletConnect from '@web3-onboard/walletconnect'
import pkModule from '@/services/private-key-module'
import { ledgerModule } from '@/services/onboard/ledger-module'
import { trezorModule } from '@/services/onboard/trezor/module'

import { CGW_NAMES, WALLET_KEYS } from './consts'

const prefersDarkMode = (): boolean => {
  return window?.matchMedia('(prefers-color-scheme: dark)')?.matches
}

type WalletInits = InitOptions['wallets']
type WalletInit = WalletInits extends Array<infer U> ? U : never

const walletConnectV2 = () => {
  // WalletConnect v2 requires a project ID
  if (!WC_PROJECT_ID) {
    return () => null
  }

  return walletConnect({
    version: 2,
    projectId: WC_PROJECT_ID,
    qrModalOptions: {
      themeVariables: {
        // The QR modal is opened from inside onboard's connect modal, so it has to beat
        // onboard.css's `--onboard-modal-z-index` (1450) — at anything lower, onboard's
        // "Connecting to WalletConnect…" panel paints over the QR code and the connection
        // can't be completed. Matches shadcn.css's `--z-above-onboard`; kept in sync by
        // walletModalZIndex.test.ts.
        '--wcm-z-index': '1451',
      },
      themeMode: prefersDarkMode() ? 'dark' : 'light',
    },
    // No `requiredChains`: anything listed there lands in WalletConnect's `requiredNamespaces`,
    // which a wallet cannot negotiate. A wallet that can't serve the Safe's chain — MetaMask with
    // test networks off, looking at a Sepolia Safe — shows the approval sheet, then silently never
    // returns a session, so the connect hangs with nothing logged on either side.
    // Omitting it also leaves `optionalChains` at its default (every chain onboard was
    // initialised with), so the wallet connects with whatever it supports. Being on the wrong
    // chain afterwards is already handled: `useIsWrongChain` gates the UI and `assertWalletChain`
    // switches the wallet before signing.
    dappUrl: location.origin,
  })
}

const WALLET_MODULES: Partial<{ [_key in WALLET_KEYS]: (chain: Chain) => WalletInit }> = {
  [WALLET_KEYS.INJECTED]: () => injectedWalletModule() as WalletInit,
  [WALLET_KEYS.WALLETCONNECT_V2]: () => walletConnectV2() as WalletInit,
  [WALLET_KEYS.COINBASE]: () => coinbaseModule({ darkMode: prefersDarkMode() }) as WalletInit,
  [WALLET_KEYS.LEDGER]: () => ledgerModule(),
  [WALLET_KEYS.TREZOR]: () => trezorModule(),
  [WALLET_KEYS.PK]: (chain) => pkModule(chain.chainId, chain.rpcUri) as WalletInit,
}

export const getAllWallets = (chain: Chain): WalletInits => {
  return Object.values(WALLET_MODULES).map((module) => module(chain))
}

export const isWalletSupported = (disabledWallets: string[], walletLabel: string): boolean => {
  const legacyWalletName = CGW_NAMES?.[walletLabel.toUpperCase() as WALLET_KEYS]
  return !disabledWallets.includes(legacyWalletName || walletLabel)
}

export const getSupportedWallets = (chain: Chain): WalletInits => {
  const enabledWallets = Object.entries(WALLET_MODULES).filter(([key]) => isWalletSupported(chain.disabledWallets, key))

  if (enabledWallets.length === 0) {
    return [injectedWalletModule()]
  }

  return enabledWallets.map(([, module]) => module(chain))
}
