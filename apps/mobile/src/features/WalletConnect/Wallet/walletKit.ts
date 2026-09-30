import { LogBox } from 'react-native'
import { Core } from '@walletconnect/core'
import { WalletKit, type IWalletKit } from '@reown/walletkit'
import { createMmkvStorage } from '../shared/mmkvStorageAdapter'
import { REOWN_PROJECT_ID } from '../shared/projectId'
import { SAFE_WALLET_METADATA } from '../shared/metadata'
import { BENIGN_WALLETKIT_PATTERNS } from './utils/errors'

const WALLET_MMKV_ID = 'safe_wc_dapp'

// WalletKit / @walletconnect/core emit noisy console.errors when the relay reconnects
// and delivers backlogged messages referencing records the local instance no longer
// knows about. These are benign — suppress the on-device LogBox toast (no-op in prod).
LogBox.ignoreLogs(BENIGN_WALLETKIT_PATTERNS)

// Dual-package hazard: @walletconnect/core resolves to a newer semver in the mobile
// workspace than the copy bundled inside @reown/walletkit. The two are structurally
// identical for everything we use; narrow the cast to the exact core type WalletKit.init
// expects rather than using `any`.
type WalletKitCore = Parameters<typeof WalletKit.init>[0]['core']

let walletKit: IWalletKit | null = null
let initPromise: Promise<IWalletKit> | null = null

export const getWalletKit = (): Promise<IWalletKit> => {
  if (walletKit) {
    return Promise.resolve(walletKit)
  }
  if (initPromise) {
    return initPromise
  }

  initPromise = (async () => {
    const core = new Core({
      projectId: REOWN_PROJECT_ID,
      storage: createMmkvStorage(WALLET_MMKV_ID),
      // The Reown Signer (AppKit) creates its own Core. @walletconnect/core dedupes Cores
      // via globalThis[_walletConnectCore_<prefix>]; two Cores with the same (default '')
      // prefix clobber each other. Namespace this Core under wc_dapp_ so it lives in its
      // own global slot, independent of AppKit's.
      customStoragePrefix: 'wc_dapp_',
    }) as unknown as WalletKitCore
    const instance = await WalletKit.init({
      core,
      metadata: SAFE_WALLET_METADATA,
    })
    walletKit = instance
    return instance
  })().catch((e) => {
    // Reset so a later call can retry instead of staying stuck on a permanent rejection.
    initPromise = null
    throw e
  })

  return initPromise
}
