import { LogBox } from 'react-native'
import { Core } from '@walletconnect/core'
import { WalletKit, type IWalletKit } from '@reown/walletkit'
import { createMmkvStorage } from '../shared/mmkvStorageAdapter'
import { REOWN_PROJECT_ID } from '../shared/projectId'
import { SAFE_WALLET_METADATA } from '../shared/metadata'

const WALLET_MMKV_ID = 'walletkit'

// WalletKit / @walletconnect/core emit noisy console.errors when the relay reconnects
// and delivers backlogged messages that reference history / session records the local
// instance no longer knows about. These are benign — the dApp retries cleanly — but
// they pollute LogBox during development. Suppress the on-device toast layer here.
// (LogBox is a no-op in production. The JS DevTools console will still show them.)
LogBox.ignoreLogs([
  'emitting session_update',
  'No matching key. session:',
  'No matching key. history:',
  'No matching key. proposal id:',
  'session topic does not exist',
])

// Dual-package hazard: @walletconnect/core resolves to a newer semver in the mobile
// workspace than the version bundled inside @reown/walletkit's own node_modules.
// The two copies are structurally identical for all properties we use; the only
// structural mismatch TypeScript reports is in the pino logger type.
// We narrow the cast to exactly the core type that WalletKit.init expects rather
// than using `any`, so all other type contracts remain intact.
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
    }) as unknown as WalletKitCore
    const instance = await WalletKit.init({
      core,
      metadata: SAFE_WALLET_METADATA,
    })
    walletKit = instance
    return instance
  })().catch((e) => {
    // Reset so a subsequent call can retry instead of staying stuck on a permanent rejection.
    initPromise = null
    throw e
  })

  return initPromise
}
